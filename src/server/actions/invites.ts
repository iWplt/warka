"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";
import { generateRepInviteCode, normalizeAccessCode } from "@/lib/auth/access-code";
import {
  finalizeRepInviteCodeInternal,
  releaseRepInviteCodeInternal,
  reserveRepInviteCodeInternal,
  validateInviteRow,
  validateRepInviteCodeInternal,
} from "@/lib/invites/lifecycle";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit-log";
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

  if (error) throw new Error("Could not create invite code");
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

  if (error) throw new Error("Could not revoke invite code");
  revalidatePath("/admin/invites");
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function validateRepInviteCode(
  rawCode: string,
  email?: string
): Promise<{
  valid: boolean;
  error?: string;
  inviteId?: string;
}> {
  const ip = await clientIp();
  const rl = checkRateLimit(rateLimitKey("invite-validate", ip), 30, 15 * 60 * 1000);
  if (!rl.allowed) {
    logSecurityEvent("auth.rate_limited", { scope: "invite-validate", ip });
    return { valid: false, error: "rate_limited" };
  }

  const result = await validateRepInviteCodeInternal(rawCode, email);
  if (!result.valid) {
    logSecurityEvent("invite.invalid", { ip, error: result.error ?? "invalid" });
  }
  return result;
}

/** Atomically reserves a slot on the invite before account creation. */
export async function reserveRepInviteCode(
  rawCode: string,
  email: string
): Promise<{ success: boolean; inviteId?: string; error?: string }> {
  const ip = await clientIp();
  const rl = checkRateLimit(rateLimitKey("invite-reserve", ip), 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    logSecurityEvent("auth.rate_limited", { scope: "invite-reserve", ip });
    return { success: false, error: "rate_limited" };
  }

  return reserveRepInviteCodeInternal(rawCode, email);
}

/**
 * @deprecated Not exposed for client use — kept name for auth.ts compatibility via re-export.
 * Prefer @/lib/invites/lifecycle
 */
export async function releaseRepInviteCode(inviteId: string): Promise<void> {
  // Block anonymous client abuse: require a recent reservation context is hard;
  // only allow from server modules that import lifecycle directly.
  // This Server Action now no-ops unless called with a valid UUID after rate limit.
  const ip = await clientIp();
  const rl = checkRateLimit(rateLimitKey("invite-release", ip), 5, 15 * 60 * 1000);
  if (!rl.allowed) return;
  // Intentionally do nothing for public callers — auth signup uses lifecycle Internal.
  void inviteId;
  void releaseRepInviteCodeInternal;
}

export async function finalizeRepInviteCode(inviteId: string, userId: string): Promise<void> {
  const ip = await clientIp();
  const rl = checkRateLimit(rateLimitKey("invite-finalize", ip), 5, 15 * 60 * 1000);
  if (!rl.allowed) throw new Error("Too many requests");
  // Public finalize blocked — use lifecycle from auth signup only
  void inviteId;
  void userId;
  void finalizeRepInviteCodeInternal;
  throw new Error("Forbidden");
}

/** @deprecated Use reserveRepInviteCode + lifecycle finalize instead */
export async function consumeRepInviteCode(inviteId: string, userId: string, email: string) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { data: invite } = await admin
    .from("representative_invite_codes")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (!invite) throw new Error("Invite not found");

  const check = validateInviteRow(invite as RepresentativeInviteCode, email);
  if (!check.valid) throw new Error("Invalid invite");

  const reserved = await reserveRepInviteCodeInternal(invite.code, email);
  if (!reserved.success) throw new Error("Could not consume invite");

  await finalizeRepInviteCodeInternal(inviteId, userId);
}

// re-export normalize for any callers
export { normalizeAccessCode };
