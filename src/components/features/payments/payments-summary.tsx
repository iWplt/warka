"use client";

import { useTranslations } from "next-intl";
import { CreditCard, Wallet } from "lucide-react";
import { formatIqd } from "@/lib/format/currency";
import { useLocale } from "next-intl";

type PaymentsSummaryProps = {
  totalRevenue: number;
  unpaidTotal: number;
  partialCount: number;
};

export function PaymentsSummary({
  totalRevenue,
  unpaidTotal,
  partialCount,
}: PaymentsSummaryProps) {
  const t = useTranslations("payments");
  const locale = useLocale();

  const cards = [
    {
      label: t("totalRevenue"),
      value: formatIqd(totalRevenue, locale),
      icon: Wallet,
    },
    {
      label: t("unpaidTotal"),
      value: formatIqd(unpaidTotal, locale),
      icon: CreditCard,
    },
    {
      label: t("partialCount"),
      value: partialCount,
      icon: CreditCard,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
            <div className="flex items-center justify-between">
              <Icon className="size-6 text-primary" aria-hidden />
              <p className="text-xl font-bold tabular-nums">{card.value}</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{card.label}</p>
          </article>
        );
      })}
    </div>
  );
}
