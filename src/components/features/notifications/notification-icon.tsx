import {
  Bell,
  Camera,
  CheckCircle,
  CreditCard,
  Edit,
  Package,
  Printer,
  Truck,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@/types/database";
import { cn } from "@/lib/utils";

const ICON_BY_TYPE: Record<NotificationType, LucideIcon> = {
  new_order: Package,
  new_group_order: Users,
  design_uploaded: Upload,
  modification_requested: Edit,
  design_approved: CheckCircle,
  ready_for_printing: Printer,
  printing_started: Printer,
  ready_for_delivery: Truck,
  payment_received: CreditCard,
  production_ready: Camera,
  general: Bell,
};

type NotificationIconProps = {
  type: NotificationType;
  className?: string;
};

export function NotificationIcon({ type, className }: NotificationIconProps) {
  const Icon = ICON_BY_TYPE[type] ?? Bell;
  return <Icon className={cn("size-5 shrink-0 text-warka-primary", className)} aria-hidden />;
}
