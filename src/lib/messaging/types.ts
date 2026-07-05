export const WHATSAPP_EVENT_TYPES = [
  "order_confirmed",
  "deposit_paid",
  "ready_for_pickup",
  "production_photos_uploaded",
  "payment_reminder",
] as const;

export type WhatsAppEventType = (typeof WHATSAPP_EVENT_TYPES)[number];

export type NotificationChannel = "whatsapp" | "sms" | "email";

export type NotificationLogStatus = "pending" | "sent" | "failed";

export type TemplateVariables = {
  order_number?: string;
  student_name?: string;
  order_link?: string;
  deposit_amount?: string;
  days_waiting?: string;
};

export const EVENT_TYPE_LABELS: Record<WhatsAppEventType, { ar: string; en: string }> = {
  order_confirmed: { ar: "تأكيد الطلب", en: "Order confirmed" },
  deposit_paid: { ar: "دفع العربون", en: "Deposit paid" },
  ready_for_pickup: { ar: "جاهز للاستلام", en: "Ready for pickup" },
  production_photos_uploaded: { ar: "صور الإنتاج", en: "Production photos uploaded" },
  payment_reminder: { ar: "تذكير بالعربون", en: "Deposit payment reminder" },
};

export const TEMPLATE_VARIABLE_HINTS = [
  "{{order_number}}",
  "{{student_name}}",
  "{{order_link}}",
  "{{deposit_amount}}",
  "{{days_waiting}}",
];
