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
  accent: "bg-amber-50 text-amber-700",
  default: "bg-warka-bg text-warka-text-secondary",
};

export function StatsCards({ items }: StatsCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isNumeric = typeof item.value === "number";
        const accent = item.accent ?? "default";

        return (
          <div
            key={item.label}
            className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover sm:p-5"
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
              <p className="text-price text-lg tracking-tight sm:text-xl">
                {isNumeric ? <CountUp value={item.value as number} /> : item.value}
              </p>
            </div>
            <p className="text-caption mt-3">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}
