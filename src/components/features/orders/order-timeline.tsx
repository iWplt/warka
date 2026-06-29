"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import type { OrderStatusHistory } from "@/types/database";

type OrderTimelineProps = {
  history: (OrderStatusHistory & { profiles?: { full_name: string } | null })[];
};

export function OrderTimeline({ history }: OrderTimelineProps) {
  const t = useTranslations("orderStatus");
  const timelineT = useTranslations("orders");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? ar : enUS;

  if (!history.length) {
    return (
      <p className="text-sm text-muted-foreground">{timelineT("noHistory")}</p>
    );
  }

  return (
    <ol className="relative space-y-4 border-s border-glass-border ps-6">
      {history.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -start-[25px] flex size-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
          <div className="rounded-xl glass p-3">
            <p className="font-medium">{t(entry.to_status)}</p>
            {entry.from_status && (
              <p className="text-xs text-muted-foreground">
                from {t(entry.from_status)}
              </p>
            )}
            {entry.notes && (
              <p className="mt-1 text-sm text-muted-foreground">{entry.notes}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {format(new Date(entry.created_at), "PPp", { locale: dateLocale })}
              {entry.profiles?.full_name && ` · ${entry.profiles.full_name}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
