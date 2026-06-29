"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { OrderStatus } from "@/types/database";
import {
  ORDER_LIFECYCLE,
  isLifecycleActive,
  isLifecycleComplete,
  type OrderLifecycleStep,
} from "@/lib/orders/status-flow";
import { cn } from "@/lib/utils";

type StudentOrderProgressProps = {
  status: OrderStatus;
};

export function StudentOrderProgress({ status }: StudentOrderProgressProps) {
  const t = useTranslations("studentOrder");
  const statusT = useTranslations("orderStatus");

  if (status === "cancelled") {
    return (
      <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {statusT("cancelled")}
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 border-s-2 border-border ps-6">
      {ORDER_LIFECYCLE.map((step, index) => {
        const done = isLifecycleComplete(status, step);
        const active = isLifecycleActive(status, step);
        const pending = !done && !active;

        return (
          <li key={step} className="relative pb-8 last:pb-0">
            <span
              className={cn(
                "absolute -start-[1.65rem] flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary bg-primary/10 text-primary",
                pending && "border-muted bg-background text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
            </span>
            <div
              className={cn(
                "rounded-xl border px-4 py-3",
                done && "border-primary/25 bg-primary/5",
                active && "border-primary/30 bg-primary/5",
                pending && "border-border bg-card text-muted-foreground"
              )}
            >
              <p className="font-medium">{t(`lifecycle.${step}` as `lifecycle.${OrderLifecycleStep}`)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {done
                  ? t("lifecycle.done")
                  : active
                    ? t("lifecycle.inProgress")
                    : t("lifecycle.upcoming")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
