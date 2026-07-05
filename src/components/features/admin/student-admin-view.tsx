"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft, GraduationCap, Package, Receipt, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shared";
import { InvoiceDownloadButton } from "@/components/features/orders/invoice-download-button";
import { formatIqd } from "@/lib/format/currency";
import type { StudentAdminDashboard } from "@/server/actions/student-admin";

const KNOWN_ACTIVITY_ACTIONS = [
  "create_order",
  "update_order",
  "cancel_order",
  "unlock_order",
  "regenerate_student_credentials",
  "create_student_account",
  "record_payment",
  "add_note",
  "status_change",
] as const;

function activityLabel(
  action: string,
  activityT: ReturnType<typeof useTranslations>,
  statusT: ReturnType<typeof useTranslations>,
  kind: "activity" | "status_change"
): string {
  if (kind === "status_change") {
    return statusT(action as never);
  }
  if (KNOWN_ACTIVITY_ACTIONS.includes(action as (typeof KNOWN_ACTIVITY_ACTIONS)[number])) {
    return activityT(`actions.${action}` as never);
  }
  return action;
}

type StudentAdminViewProps = {
  data: StudentAdminDashboard;
};

export function StudentAdminView({ data }: StudentAdminViewProps) {
  const t = useTranslations("studentAdmin");
  const statusT = useTranslations("orderStatus");
  const productT = useTranslations("productType");
  const paymentT = useTranslations("paymentMethod");
  const activityT = useTranslations("activity");
  const locale = useLocale();
  const { profile, batches, orders, payments, auditTrail, stats } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 gap-2 ps-0">
            <Link href="/admin/users">
              <ArrowLeft className="size-4" aria-hidden />
              {t("backToUsers")}
            </Link>
          </Button>
          <h1 className="text-h1 font-bold">{profile.full_name}</h1>
          <p className="text-muted-foreground">
            {profile.phone ?? "—"} · {profile.college ?? "—"}
            {profile.department ? ` · ${profile.department}` : ""}
          </p>
          {profile.access_code && (
            <p className="mt-2 font-mono text-sm text-primary">{profile.access_code}</p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm ${
            profile.is_active ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
          }`}
        >
          {profile.is_active ? t("active") : t("inactive")}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("totalOrders")} value={String(stats.totalOrders)} />
        <StatCard label={t("activeOrders")} value={String(stats.activeOrders)} />
        <StatCard label={t("totalPaid")} value={formatIqd(stats.totalPaid, locale)} />
        <StatCard label={t("balanceDue")} value={formatIqd(stats.balanceDue, locale)} />
      </div>

      <section className="rounded-2xl border border-glass-border glass p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <GraduationCap className="size-5 text-primary" aria-hidden />
          {t("profileSection")}
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <InfoRow label={t("fullName")} value={profile.full_name} />
          <InfoRow label={t("phone")} value={profile.phone ?? "—"} />
          <InfoRow label={t("college")} value={profile.college ?? "—"} />
          <InfoRow label={t("department")} value={profile.department ?? "—"} />
          <InfoRow label={t("stage")} value={profile.stage ?? "—"} />
          <InfoRow label={t("graduationYear")} value={profile.graduation_year?.toString() ?? "—"} />
          <InfoRow label={t("studentIdNumber")} value={profile.student_id_number ?? "—"} />
          <InfoRow
            label={t("joined")}
            value={new Date(profile.created_at).toLocaleDateString(locale)}
          />
        </dl>
      </section>

      {batches.length > 0 && (
        <section className="rounded-2xl border border-glass-border glass p-6">
          <h2 className="mb-4 font-semibold">{t("batchesSection")}</h2>
          <ul className="space-y-3">
            {batches.map(({ batch, roster }) => (
              <li
                key={roster.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-foreground/5 p-4 text-sm"
              >
                <div>
                  <Link
                    href={`/admin/batches/${batch.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {batch.name}
                  </Link>
                  <p className="text-muted-foreground">
                    {batch.college} · {batch.status}
                    {roster.size ? ` · ${t("size")}: ${roster.size}` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {roster.confirmed ? t("confirmed") : t("draft")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-glass-border glass p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Package className="size-5 text-primary" aria-hidden />
          {t("ordersSection")}
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-glass-border bg-foreground/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <OrderStatusBadge
                        status={order.status}
                        label={statusT(order.status)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString(locale)}
                      </span>
                    </div>
                  </div>
                  <div className="text-end text-sm">
                    <p className="font-semibold">{formatIqd(Number(order.total), locale)}</p>
                    <p className="text-muted-foreground">
                      {t("paid")}: {formatIqd(order.paid, locale)} · {t("balance")}:{" "}
                      {formatIqd(order.balance, locale)}
                    </p>
                    {order.deposit_paid_at && (
                      <p className="mt-1 text-xs text-primary">{t("depositPaid")}</p>
                    )}
                    <div className="mt-2">
                      <InvoiceDownloadButton
                        orderId={order.id}
                        orderNumber={order.order_number}
                        variant="outline"
                      />
                    </div>
                  </div>
                </div>
                {order.items.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-glass-border pt-3 text-sm">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <span>
                          {productT(item.product_type)}
                          {item.size ? ` · ${item.size}` : ""}
                          {item.custom_text ? ` · "${item.custom_text}"` : ""}
                          {item.font_family ? ` · ${item.font_family}` : ""}
                        </span>
                        <span className="tabular-nums">
                          {formatIqd(Number(item.unit_price), locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-glass-border glass p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Receipt className="size-5 text-primary" aria-hidden />
          {t("paymentsSection")}
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noPayments")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {payments.map((payment) => {
              const order = orders.find((o) => o.id === payment.order_id);
              return (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-foreground/5 px-3 py-2"
                >
                  <span>
                    {order?.order_number ?? payment.order_id.slice(0, 8)} ·{" "}
                    {paymentT(payment.method)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatIqd(Number(payment.amount), locale)}
                  </span>
                  <time className="w-full text-xs text-muted-foreground sm:w-auto">
                    {new Date(payment.created_at).toLocaleString(locale)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-glass-border glass p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <ScrollText className="size-5 text-primary" aria-hidden />
          {t("auditSection")}
        </h2>
        {auditTrail.length === 0 ? (
          <p className="text-sm text-muted-foreground">{activityT("empty")}</p>
        ) : (
          <ul className="max-h-[480px] space-y-2 overflow-y-auto text-sm">
            {auditTrail.map((entry) => {
              const label =
                entry.kind === "status_change"
                  ? `${t("statusChanged")}: ${activityLabel(entry.action, activityT, statusT, entry.kind)}`
                  : activityLabel(entry.action, activityT, statusT, entry.kind);

              return (
                <li
                  key={entry.id}
                  className="rounded-lg bg-foreground/5 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {entry.actor_name ?? t("system")} — {label}
                      </p>
                      {entry.order_number && (
                        <Link
                          href={`/admin/orders/${entry.order_id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {entry.order_number}
                        </Link>
                      )}
                      {entry.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">{entry.notes}</p>
                      )}
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString(locale)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-glass-border glass p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
