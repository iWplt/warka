import type { Order, OrderStatus } from "@/types/database";
import { EMBROIDERY_QUEUE_STATUSES } from "@/lib/orders/status-flow";

/** Statuses where the order exists but deposit is not yet paid. */
export const PRE_DEPOSIT_STATUSES: OrderStatus[] = ["new"];

/** Order is considered confirmed only after deposit is recorded. */
export function isOrderConfirmed(order: Pick<Order, "deposit_paid_at" | "is_locked">): boolean {
  return Boolean(order.deposit_paid_at) || order.is_locked;
}

export function canStudentEditOrder(
  order: Pick<Order, "status" | "deposit_paid_at" | "is_locked">
): boolean {
  if (order.status === "cancelled" || order.status === "delivered") return false;
  return !isOrderConfirmed(order);
}

/** Embroidery staff may edit personalization during production (even after deposit). */
export function canEmbroideryEditOrder(order: Pick<Order, "status">): boolean {
  return EMBROIDERY_QUEUE_STATUSES.includes(order.status as OrderStatus);
}

export function orderLockMessage(locale: "ar" | "en"): string {
  return locale === "ar"
    ? "تم تثبيت الطلب — للتعديل تواصل مع المطبعة"
    : "Order confirmed — contact the print shop to make changes";
}

export function nextStatusAfterDeposit(): OrderStatus {
  return "pending_review";
}

export function statusLabelForStudent(
  order: Pick<Order, "status" | "deposit_paid_at" | "deposit_required">,
  locale: "ar" | "en"
): string {
  if (!order.deposit_paid_at && Number(order.deposit_required) > 0) {
    return locale === "ar" ? "بانتظار موافقة العربون" : "Awaiting deposit approval";
  }
  if (!order.deposit_paid_at && order.status === "new") {
    return locale === "ar" ? "بانتظار العربون" : "Awaiting deposit";
  }
  return order.status;
}
