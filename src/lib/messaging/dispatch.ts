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
