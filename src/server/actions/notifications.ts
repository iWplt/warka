"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";

/**
 * Client-callable notification actions.
 * Admin notify / activity helpers live in @/lib/notifications/internal (not Server Actions).
 */

export async function getNotifications(_userId?: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return data ?? [];
}

export async function markNotificationRead(notificationId: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  if (!supabase) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", profile.id);
}

export async function markAllNotificationsRead(_userId?: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  if (!supabase) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", profile.id)
    .eq("read", false);
}
