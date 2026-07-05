import type { OrderStatus } from "@/types/database";

/** Student-facing lifecycle (maps to existing DB enum values). */
export const ORDER_LIFECYCLE = [
  "pending",
  "design_review",
  "approved",
  "printing",
  "ready",
  "delivered",
] as const;

export type OrderLifecycleStep = (typeof ORDER_LIFECYCLE)[number];

const STATUS_TO_LIFECYCLE: Record<OrderStatus, OrderLifecycleStep> = {
  new: "pending",
  pending_review: "pending",
  designing: "design_review",
  awaiting_approval: "design_review",
  needs_modification: "design_review",
  ready_for_printing: "approved",
  printing: "printing",
  printed: "printing",
  ready_for_delivery: "ready",
  delivered: "delivered",
  cancelled: "pending",
};

/** Statuses employees in printing role may access. */
export const EMBROIDERY_QUEUE_STATUSES: OrderStatus[] = [
  "new",
  "pending_review",
  "designing",
  "awaiting_approval",
  "needs_modification",
  "ready_for_printing",
  "printing",
  "printed",
];

export const PRINTING_PIPELINE_STATUSES: OrderStatus[] = [
  "ready_for_printing",
  "printing",
  "printed",
  "ready_for_delivery",
  "delivered",
];

export function statusToLifecycle(status: OrderStatus): OrderLifecycleStep {
  return STATUS_TO_LIFECYCLE[status] ?? "pending";
}

export function lifecycleStepIndex(status: OrderStatus): number {
  const step = statusToLifecycle(status);
  const index = ORDER_LIFECYCLE.indexOf(step);
  return index === -1 ? 0 : index;
}

export function isLifecycleComplete(status: OrderStatus, step: OrderLifecycleStep): boolean {
  if (status === "delivered") return true;
  return lifecycleStepIndex(status) > ORDER_LIFECYCLE.indexOf(step);
}

export function isLifecycleActive(status: OrderStatus, step: OrderLifecycleStep): boolean {
  return statusToLifecycle(status) === step;
}

/** Admin transitions aligned with simplified pipeline (maps to DB enum). */
export const LIFECYCLE_NEXT_STATUS: Partial<Record<OrderLifecycleStep, OrderStatus>> = {
  pending: "pending_review",
  design_review: "awaiting_approval",
  approved: "ready_for_printing",
  printing: "printing",
  ready: "ready_for_delivery",
  delivered: "delivered",
};
