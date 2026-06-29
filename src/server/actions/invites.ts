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

export async function validateRepInviteCode(rawCode: string): Promise<{
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

  if (!invite || !invite.is_active) {
    return { valid: false, error: "invalid" };
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { valid: false, error: "expired" };
  }

  if (invite.used_count >= invite.max_uses) {
    return { valid: false, error: "used" };
  }

  return { valid: true, inviteId: invite.id };
}

export async function consumeRepInviteCode(inviteId: string, userId: string, email: string) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { data: invite } = await admin
    .from("representative_invite_codes")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (!invite) throw new Error("Invite not found");

  if (invite.assigned_email && invite.assigned_email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("This invite is reserved for a different email");
  }

  const { error } = await admin
    .from("representative_invite_codes")
    .update({
      used_count: invite.used_count + 1,
      used_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inviteId);

  if (error) throw new Error(error.message);
}
