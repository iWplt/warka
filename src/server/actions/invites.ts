"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";
import { generateRepInviteCode, normalizeAccessCode } from "@/lib/auth/access-code";
import type { RepresentativeInviteCode } from "@/types/database";

export async function listRepInviteCodes(): Promise<RepresentativeInviteCode[]> {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("representative_invite_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as RepresentativeInviteCode[];
}

const createInviteSchema = z.object({
  assigned_email: z.string().email().optional().or(z.literal("")),
  expires_days: z.coerce.number().int().min(1).max(365).optional(),
  notes: z.string().max(500).optional(),
});

export async function createRepInviteCode(input: z.infer<typeof createInviteSchema>) {
  const adminProfile = await requireRole(["admin"]);
  const data = createInviteSchema.parse(input);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  let code = generateRepInviteCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await admin
      .from("representative_invite_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
    code = generateRepInviteCode();
  }

  const expiresAt = data.expires_days
    ? new Date(Date.now() + data.expires_days * 86_400_000).toISOString()
    : null;

  const { error } = await admin.from("representative_invite_codes").insert({
    code,
    created_by: adminProfile.id,
    assigned_email: data.assigned_email?.trim() || null,
    expires_at: expiresAt,
    notes: data.notes?.trim() || null,
    is_active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/invites");
  return code;
}

export async function revokeRepInviteCode(id: string) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { error } = await admin
    .from("representative_invite_codes")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/invites");
}

type InviteRow = RepresentativeInviteCode;

function validateInviteRow(invite: InviteRow | null, email?: string): {
  valid: boolean;
  error?: string;
  inviteId?: string;
} {
  if (!invite || !invite.is_active) {
    return { valid: false, error: "invalid" };
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { valid: false, error: "expired" };
  }

  if (invite.used_count >= invite.max_uses) {
    return { valid: false, error: "used" };
  }

  if (invite.assigned_email && email) {
    if (invite.assigned_email.toLowerCase() !== email.trim().toLowerCase()) {
      return { valid: false, error: "email_mismatch" };
    }
  }

  return { valid: true, inviteId: invite.id };
}

export async function validateRepInviteCode(
  rawCode: string,
  email?: string
): Promise<{
  valid: boolean;
  error?: string;
  inviteId?: string;
}> {
  const code = normalizeAccessCode(rawCode);
  const admin = createAdminClient();
  if (!admin) return { valid: false, error: "config" };

  const { data: invite } = await admin
    .from("representative_invite_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  return validateInviteRow(invite as InviteRow | null, email);
}

/** Atomically reserves a slot on the invite before account creation. */
export async function reserveRepInviteCode(
  rawCode: string,
  email: string
): Promise<{ success: boolean; inviteId?: string; error?: string }> {
  const code = normalizeAccessCode(rawCode);
  const admin = createAdminClient();
  if (!admin) return { success: false, error: "config" };

  const { data: invite } = await admin
    .from("representative_invite_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  const check = validateInviteRow(invite as InviteRow | null, email);
  if (!check.valid || !check.inviteId || !invite) {
    return { success: false, error: check.error ?? "invalid" };
  }

  const nextCount = invite.used_count + 1;
  const { data: updated, error } = await admin
    .from("representative_invite_codes")
    .update({
      used_count: nextCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invite.id)
    .eq("used_count", invite.used_count)
    .eq("is_active", true)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return { success: false, error: "used" };
  }

  return { success: true, inviteId: invite.id };
}

/** Rolls back a reservation when signup fails after reserve. */
export async function releaseRepInviteCode(inviteId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: invite } = await admin
    .from("representative_invite_codes")
    .select("used_count")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite || invite.used_count <= 0) return;

  await admin
    .from("representative_invite_codes")
    .update({
      used_count: Math.max(0, invite.used_count - 1),
      updated_at: new Date().toISOString(),
    })
    .eq("id", inviteId);
}

/** Links the reserved invite to the newly created profile. */
export async function finalizeRepInviteCode(inviteId: string, userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { error } = await admin
    .from("representative_invite_codes")
    .update({
      used_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inviteId);

  if (error) throw new Error(error.message);
}

/** @deprecated Use reserveRepInviteCode + finalizeRepInviteCode instead */
export async function consumeRepInviteCode(inviteId: string, userId: string, email: string) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { data: invite } = await admin
    .from("representative_invite_codes")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (!invite) throw new Error("Invite not found");

  const check = validateInviteRow(invite as InviteRow, email);
  if (!check.valid) throw new Error(check.error ?? "Invalid invite");

  const reserved = await reserveRepInviteCode(invite.code, email);
  if (!reserved.success) throw new Error(reserved.error ?? "Could not consume invite");

  await finalizeRepInviteCode(inviteId, userId);
}
