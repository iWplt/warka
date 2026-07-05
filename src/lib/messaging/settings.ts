import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type MessagingSettings = {
  whatsapp_enabled: boolean;
  deposit_reminder_days: number;
};

export const DEFAULT_MESSAGING_SETTINGS: MessagingSettings = {
  whatsapp_enabled: true,
  deposit_reminder_days: 3,
};

function parseMessagingSettings(raw: unknown): MessagingSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_MESSAGING_SETTINGS;
  const v = raw as Record<string, unknown>;
  return {
    whatsapp_enabled:
      typeof v.whatsapp_enabled === "boolean"
        ? v.whatsapp_enabled
        : DEFAULT_MESSAGING_SETTINGS.whatsapp_enabled,
    deposit_reminder_days:
      typeof v.deposit_reminder_days === "number" && v.deposit_reminder_days > 0
        ? Math.floor(v.deposit_reminder_days)
        : DEFAULT_MESSAGING_SETTINGS.deposit_reminder_days,
  };
}

export async function getMessagingSettings(): Promise<MessagingSettings> {
  const supabase = await createClient();
  if (!supabase) return DEFAULT_MESSAGING_SETTINGS;

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "messaging")
    .maybeSingle();

  if (!data?.value) return DEFAULT_MESSAGING_SETTINGS;
  return parseMessagingSettings(data.value);
}

export async function getMessagingSettingsAdmin(): Promise<MessagingSettings> {
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

export { parseMessagingSettings };
