import type { OrderStatus } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Partial<
  Record<OrderStatus, "default" | "secondary" | "warning" | "success" | "destructive" | "outline">
> = {
  new: "secondary",
  pending_review: "warning",
  designing: "default",
  awaiting_approval: "default",
  needs_modification: "warning",
  ready_for_printing: "default",
  printing: "default",
  printed: "default",
  ready_for_delivery: "success",
  delivered: "success",
  cancelled: "destructive",
};

type OrderStatusBadgeProps = {
  status: OrderStatus;
  label: string;
  className?: string;
};

export function OrderStatusBadge({ status, label, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"} className={cn("rounded-full", className)}>
      {label}
    </Badge>
  );
}
