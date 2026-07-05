"use client";

import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Select } from "@/components/ui/select";
import type { Batch } from "@/types/database";
import type { BatchTrackingSummary } from "@/server/actions/batches";

type BatchTrackingViewProps = {
  batches: Batch[];
  selectedBatchId: string;
  summary: BatchTrackingSummary | null;
};

export function BatchTrackingView({
  batches,
  selectedBatchId,
  summary,
}: BatchTrackingViewProps) {
  const t = useTranslations("tracking");
  const statusT = useTranslations("orderStatus");
  const paymentT = useTranslations("paymentStatus");
  const router = useRouter();

  const handleBatchChange = (batchId: string) => {
    router.push(`/representative/tracking?batchId=${batchId}`);
  };

  if (batches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-glass-border glass p-12 text-center">
        <p className="text-muted-foreground">{t("noBatch")}</p>
        <Link href="/representative/batches" className="mt-4 inline-block text-primary hover:underline">
          {t("goToBatches")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold">{t("title")}</h1>
        </div>
        <Select
          value={selectedBatchId}
          onChange={(e) => handleBatchChange(e.target.value)}
          className="max-w-xs"
        >
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </Select>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label={t("statTotal")} value={summary.stats.total} />
          <StatCard label={t("statPaid")} value={summary.stats.paid} />
          <StatCard label={t("statPartial")} value={summary.stats.partial} />
          <StatCard label={t("statAccounts")} value={summary.stats.withAccount} />
          <StatCard label={t("statDelivered")} value={summary.stats.delivered} />
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-glass-border glass">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-glass-border bg-foreground/5">
              <th className="px-4 py-3 text-start">{t("student")}</th>
              <th className="px-4 py-3 text-start">{t("payment")}</th>
              <th className="px-4 py-3 text-start">{t("design")}</th>
              <th className="px-4 py-3 text-start">{t("orderStatus")}</th>
              <th className="px-4 py-3 text-start">{t("delivery")}</th>
            </tr>
          </thead>
          <tbody>
            {!summary || summary.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t("noStudents")}
                </td>
              </tr>
            ) : (
              summary.rows.map((row) => (
                <tr key={row.id} className="border-b border-glass-border">
                  <td className="px-4 py-3 font-medium">{row.full_name}</td>
                  <td className="px-4 py-3">
                    <Badge label={paymentT(row.payment_status)} tone={row.payment_status} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={t(`designStatus.${row.design_status}` as never)} tone={row.design_status} />
                  </td>
                  <td className="px-4 py-3">
                    {row.order_status ? (
                      <Badge label={statusT(row.order_status as never)} tone={row.order_status} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.order_number ? (
                      <Link
                        href={`/representative/orders/${row.order_id}`}
                        className="text-primary hover:underline"
                      >
                        {row.order_number}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-glass-border glass p-4">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </article>
  );
}

function Badge({ label, tone }: { label: string; tone: string }) {
  const color =
    tone === "paid" || tone === "delivered" || tone === "approved"
      ? "bg-primary/15 text-primary"
      : tone === "partial" || tone === "pending" || tone === "designing"
        ? "bg-accent/15 text-accent"
        : "bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
