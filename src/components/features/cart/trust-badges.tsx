"use client";

import { ShieldCheck, RotateCcw, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type TrustBadgesProps = {
  className?: string;
};

export function TrustBadges({ className }: TrustBadgesProps) {
  const t = useTranslations("cart.trust");

  const badges = [
    { icon: ShieldCheck, label: t("secure") },
    { icon: RotateCcw, label: t("refund") },
    { icon: Truck, label: t("delivery") },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1",
        className
      )}
    >
      {badges.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 text-xs text-warka-text-muted"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
