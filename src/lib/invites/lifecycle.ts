import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAccessCode } from "@/lib/auth/access-code";
import type { RepresentativeInviteCode } from "@/types/database";

type InviteRow = RepresentativeInviteCode;

export function validateInviteRow(
  invite: InviteRow | null,
  email?: string
): { valid: boolean; error?: string; inviteId?: string } {
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

export async function validateRepInviteCodeInternal(
  rawCode: string,
  email?: string
): Promise<{ valid: boolean; error?: string; inviteId?: string }> {
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

export async function reserveRepInviteCodeInternal(
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

/** Rolls back a reservation when signup fails after reserve. Server-only. */
export async function releaseRepInviteCodeInternal(inviteId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  // UUID shape guard — reject garbage IDs
  if (!/^[0-9a-f-]{36}$/i.test(inviteId)) return;

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
    .eq("id", inviteId)
    .eq("used_count", invite.used_count);
}

/** Links the reserved invite to the newly created profile. Server-only. */
export async function finalizeRepInviteCodeInternal(
  inviteId: string,
  userId: string
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  if (!/^[0-9a-f-]{36}$/i.test(inviteId) || !/^[0-9a-f-]{36}$/i.test(userId)) {
    throw new Error("Invalid invite reference");
  }

  const { error } = await admin
    .from("representative_invite_codes")
    .update({
      used_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inviteId);

  if (error) throw new Error("Could not finalize invite");
}
