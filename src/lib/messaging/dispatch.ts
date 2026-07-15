import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderMessageTemplate } from "@/lib/messaging/templates";
import { isWhatsAppConfigured, sendWhatsAppMessage } from "@/lib/messaging/whatsapp";
import type { TemplateVariables, WhatsAppEventType } from "@/lib/messaging/types";
import { getMessagingSettings } from "@/lib/messaging/settings";

export type QueueWhatsAppInput = {
  eventType: WhatsAppEventType;
  orderId: string;
  studentId: string;
  variables: TemplateVariables;
};

async function loadActiveTemplate(eventType: WhatsAppEventType): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("message_templates")
    .select("template_ar, is_active")
    .eq("event_type", eventType)
    .maybeSingle();

  if (!data?.is_active) return null;
  return data.template_ar as string;
}

async function loadStudentPhone(studentId: string): Promise<{
  phone: string | null;
  fullName: string;
}> {
  const admin = createAdminClient();
  if (!admin) return { phone: null, fullName: "الطالب" };

  const { data } = await admin
    .from("profiles")
    .select("phone, full_name")
    .eq("id", studentId)
    .maybeSingle();

  return {
    phone: (data?.phone as string | null) ?? null,
    fullName: (data?.full_name as string) || "الطالب",
  };
}

export async function processWhatsAppNotification(input: QueueWhatsAppInput): Promise<void> {
  const settings = await getMessagingSettings();
  if (!settings.whatsapp_enabled) return;

  const admin = createAdminClient();
  if (!admin) return;

  const template = await loadActiveTemplate(input.eventType);
  if (!template) return;

  const student = await loadStudentPhone(input.studentId);
  const variables: TemplateVariables = {
    student_name: student.fullName,
    ...input.variables,
    order_link: input.variables.order_link
      ? `${env.NEXT_PUBLIC_APP_URL}${input.variables.order_link}`
      : undefined,
  };

  const messageBody = renderMessageTemplate(template, variables);

  const { data: logRow, error: logError } = await admin
    .from("notifications_log")
    .insert({
      order_id: input.orderId,
      student_id: input.studentId,
      channel: "whatsapp",
      event_type: input.eventType,
      message_body: messageBody,
      status: "pending",
    })
    .select("id")
    .single();

  if (logError || !logRow) {
    console.error("[whatsapp] failed to create notifications_log", logError);
    return;
  }

  if (!student.phone) {
    await admin
      .from("notifications_log")
      .update({ status: "failed" })
      .eq("id", logRow.id);
    return;
  }

  if (!isWhatsAppConfigured()) {
    await admin
      .from("notifications_log")
      .update({ status: "failed" })
      .eq("id", logRow.id);
    return;
  }

  const result = await sendWhatsAppMessage(student.phone, messageBody);

  await admin
    .from("notifications_log")
    .update({
      status: result.ok ? "sent" : "failed",
      sent_at: result.ok ? new Date().toISOString() : null,
    })
    .eq("id", logRow.id);
}

/** Fire-and-forget — never blocks the caller. */
export function queueWhatsAppNotification(input: QueueWhatsAppInput): void {
  void processWhatsAppNotification(input).catch((err) => {
    console.error("[whatsapp] dispatch error", err);
  });
}

/**
 * Per-event idempotency guard, independent from any order flag. Returns true when
 * a WhatsApp message for (order, event) was already created/sent, so a caller can
 * avoid re-dispatching the same customer-facing event (e.g. an order re-entering
 * `ready_for_printing` after `needs_modification`). A previously *failed* attempt
 * is not counted, so a genuine retry is still allowed.
 */
export async function hasSentWhatsAppEvent(
  orderId: string,
  eventType: WhatsAppEventType
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { data } = await admin
    .from("notifications_log")
    .select("id")
    .eq("order_id", orderId)
    .eq("event_type", eventType)
    .in("status", ["pending", "sent"])
    .limit(1)
    .maybeSingle();

  return Boolean(data?.id);
}
