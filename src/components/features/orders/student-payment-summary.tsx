"use client";

import { useTranslations, useLocale } from "next-intl";
import { formatIqd } from "@/lib/format/currency";
import type { Payment } from "@/types/database";

type StudentPaymentSummaryProps = {
  total: number;
  payments: Payment[];
};

export function StudentPaymentSummary({ total, payments }: StudentPaymentSummaryProps) {
  const t = useTranslations("studentOrder");
  const methodT = useTranslations("paymentMethod");
  const locale = useLocale();

  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = Math.max(total - paid, 0);

  let paymentStatus: "paid" | "partial" | "unpaid" = "unpaid";
  if (paid >= total && total > 0) paymentStatus = "paid";
  else if (paid > 0) paymentStatus = "partial";

  return (
    <div className="rounded-2xl border border-glass-border glass p-6">
      <h2 className="mb-4 font-semibold">{t("paymentSummary")}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">{t("orderTotal")}</p>
          <p className="text-lg font-semibold">{formatIqd(total, locale)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("amountPaid")}</p>
          <p className="text-lg font-semibold">{formatIqd(paid, locale)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("balanceDue")}</p>
          <p className="text-lg font-semibold text-accent">{formatIqd(remaining, locale)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {t(`paymentState.${paymentStatus}`)}
      </p>
      {payments.length > 0 && (
        <ul className="mt-4 space-y-2">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex justify-between rounded-lg bg-foreground/5 px-3 py-2 text-sm"
            >
              <span>{methodT(payment.method)}</span>
              <span className="tabular-nums">{formatIqd(Number(payment.amount), locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
