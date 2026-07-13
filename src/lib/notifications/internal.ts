import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/types/database";

/**
 * Internal notification helpers — NOT exported as Server Actions.
 * Call only from authenticated server code after authorization checks.
 */

export async function logActivityInternal(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  if (!supabase) return;

  const { error } = await supabase.from("activity_log").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error("activity_log insert failed:", error.message);
  }
}

export async function createNotificationInternal(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string,
  entityType?: string,
  entityId?: string
) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  if (!supabase) return;

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    link,
    entity_type: entityType,
    entity_id: entityId,
  });
}

export async function notifyAdminsInternal(
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  entityType?: string,
  entityId?: string
) {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true);

  for (const row of admins ?? []) {
    await admin.from("notifications").insert({
      user_id: row.id,
      type,
      title,
      body,
      link,
      entity_type: entityType,
      entity_id: entityId,
    });
  }
}

/** Legacy signature kept for call sites that pass a permission string. */
export async function notifyAdminsAndEmployees(
  type: NotificationType,
  title: string,
  body: string,
  _permission: string,
  link?: string,
  entityType?: string,
  entityId?: string
) {
  return notifyAdminsInternal(type, title, body, link, entityType, entityId);
}
