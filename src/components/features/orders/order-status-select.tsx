"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { updateOrderStatus } from "@/server/actions/orders";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "new",
  "pending_review",
  "designing",
  "awaiting_approval",
  "needs_modification",
  "ready_for_printing",
  "printing",
  "printed",
  "ready_for_delivery",
  "delivered",
  "cancelled",
];

type OrderStatusSelectProps = {
  orderId: string;
  value: OrderStatus;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
};

export function OrderStatusSelect({
  orderId,
  value,
  disabled,
  className,
  size = "md",
}: OrderStatusSelectProps) {
  const statusT = useTranslations("orderStatus");
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (next: OrderStatus) => {
    if (next === local) return;
    const previous = local;
    setLocal(next);
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, next);
        toast.success(t("success"));
        router.refresh();
      } catch {
        setLocal(previous);
        toast.error(t("error"));
      }
    });
  };

  return (
    <div className={cn("relative inline-flex min-w-[10.5rem]", className)}>
      <Select
        value={local}
        disabled={disabled || pending}
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        aria-label={statusT(local)}
        className={cn(
          "w-full pe-9 font-medium",
          size === "sm" && "h-9 min-h-9 text-xs",
          pending && "opacity-70"
        )}
      >
        {ORDER_STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {statusT(status)}
          </option>
        ))}
      </Select>
      <ChevronDown
        className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-warka-text-muted"
        aria-hidden
      />
    </div>
  );
}
