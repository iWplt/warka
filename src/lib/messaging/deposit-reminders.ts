import { createAdminClient } from "@/lib/supabase/admin";
import { getMessagingSettings } from "@/lib/messaging/settings";
import { processWhatsAppNotification } from "@/lib/messaging/dispatch";

export type DepositReminderResult = {
  scanned: number;
  sent: number;
  skipped: number;
};

export async function runDepositPaymentReminders(): Promise<DepositReminderResult> {
  const admin = createAdminClient();
  if (!admin) return { scanned: 0, sent: 0, skipped: 0 };

  const settings = await getMessagingSettings();
  if (!settings.whatsapp_enabled) {
    return { scanned: 0, sent: 0, skipped: 0 };
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - settings.deposit_reminder_days);

  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, student_id, deposit_required, created_at")
    .eq("status", "new")
    .is("deposit_paid_at", null)
    .not("student_id", "is", null)
    .lte("created_at", cutoff.toISOString());

  let sent = 0;
  let skipped = 0;

  for (const order of orders ?? []) {
    if (!order.student_id) {
      skipped += 1;
      continue;
    }

    const { data: recentReminder } = await admin
      .from("notifications_log")
      .select("id")
      .eq("order_id", order.id)
      .eq("event_type", "payment_reminder")
      .gte(
        "created_at",
        new Date(Date.now() - settings.deposit_reminder_days * 24 * 60 * 60 * 1000).toISOString()
      )
      .limit(1)
      .maybeSingle();

    if (recentReminder) {
      skipped += 1;
      continue;
    }

    const createdAt = new Date(order.created_at as string);
    const daysWaiting = Math.max(
      settings.deposit_reminder_days,
      Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
    );

    await processWhatsAppNotification({
      eventType: "payment_reminder",
      orderId: order.id as string,
      studentId: order.student_id as string,
      variables: {
        order_number: order.order_number as string,
        deposit_amount: String(order.deposit_required ?? 0),
        days_waiting: String(daysWaiting),
        order_link: `/student/orders/${order.id}`,
      },
    });

    sent += 1;
  }

  return {
    scanned: orders?.length ?? 0,
    sent,
    skipped,
  };
}
