"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";
import {
  DEFAULT_MESSAGING_SETTINGS,
  parseMessagingSettings,
  type MessagingSettings,
} from "@/lib/messaging/settings";
import { WHATSAPP_EVENT_TYPES } from "@/lib/messaging/types";
import type { MessageTemplate, NotificationLog } from "@/types/database";

export async function getMessageTemplates(): Promise<MessageTemplate[]> {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("message_templates")
    .select("*")
    .order("event_type");

  return (data ?? []) as MessageTemplate[];
}

const templateSchema = z.object({
  event_type: z.enum(WHATSAPP_EVENT_TYPES),
  template_ar: z.string().min(1).max(2000),
  is_active: z.boolean(),
});

export async function updateMessageTemplate(input: z.infer<typeof templateSchema>) {
  await requireRole(["admin"]);
  const data = templateSchema.parse(input);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { error } = await admin
    .from("message_templates")
    .upsert(
      {
        event_type: data.event_type,
        template_ar: data.template_ar,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_type" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/messages");
}

const messagingSchema = z.object({
  whatsapp_enabled: z.boolean(),
  deposit_reminder_days: z.coerce.number().int().min(1).max(30),
});

export async function updateMessagingSettings(input: z.infer<typeof messagingSchema>) {
  await requireRole(["admin"]);
  const data = messagingSchema.parse(input);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { error } = await admin.from("platform_settings").upsert({
    key: "messaging",
    value: data satisfies MessagingSettings,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/messages");
}

export async function getMessagingSettingsForAdmin(): Promise<MessagingSettings> {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) return DEFAULT_MESSAGING_SETTINGS;

  const { data } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "messaging")
    .maybeSingle();

  if (!data?.value) return DEFAULT_MESSAGING_SETTINGS;
  return parseMessagingSettings(data.value);
}

export async function getRecentNotificationLogs(limit = 50): Promise<NotificationLog[]> {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("notifications_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as NotificationLog[];
}

export async function getWhatsAppProviderStatus(): Promise<{
  configured: boolean;
  provider: string;
}> {
  await requireRole(["admin"]);
  const { detectWhatsAppProvider, isWhatsAppConfigured } = await import(
    "@/lib/messaging/whatsapp"
  );
  return {
    configured: isWhatsAppConfigured(),
    provider: detectWhatsAppProvider(),
  };
}
