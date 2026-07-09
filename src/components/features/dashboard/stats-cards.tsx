"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/ui/count-up";

export type StatCardItem = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: "primary" | "accent" | "default";
};

type StatsCardsProps = {
  items: StatCardItem[];
};

const iconStyles = {
  primary: "bg-warka-primary/10 text-warka-primary",
  accent: "bg-amber-50 text-amber-600",
  default: "bg-warka-bg text-warka-text-secondary",
};

export function StatsCards({ items }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isNumeric = typeof item.value === "number";
        const accent = item.accent ?? "default";

        return (
          <div
            key={item.label}
            className="utility-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  iconStyles[accent]
                )}
              >
                <Icon className="size-4" aria-hidden />
              </div>
              <p className="text-xl font-bold tabular-nums tracking-tight text-warka-text">
                {isNumeric ? <CountUp value={item.value as number} /> : item.value}
              </p>
            </div>
            <p className="mt-3 text-xs text-warka-text-secondary">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}
