"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/types/database";

export async function logActivity(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
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

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string,
  entityType?: string,
  entityId?: string
) {
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

export async function notifyAdmins(
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

export async function getNotifications(userId: string) {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  return data ?? [];
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  if (!supabase) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = await createClient();
  if (!supabase) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

/** @deprecated Use notifyAdmins — employee role removed */
export async function notifyAdminsAndEmployees(
  type: NotificationType,
  title: string,
  body: string,
  _permission: string,
  link?: string,
  entityType?: string,
  entityId?: string
) {
  return notifyAdmins(type, title, body, link, entityType, entityId);
}
