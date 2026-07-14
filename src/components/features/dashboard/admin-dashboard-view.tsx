"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  ClipboardList,
  CreditCard,
  GraduationCap,
  Package,
  Palette,
  Printer,
} from "lucide-react";
import { formatIqd } from "@/lib/format/currency";
import type { AdminDashboardData } from "@/server/actions/dashboard";
import { OrdersStatusChart } from "./orders-status-chart";
import { PaymentOverviewChart } from "./payment-overview-chart";
import { RecentOrders } from "./recent-orders";
import { StatsCards } from "./stats-cards";

type AdminDashboardViewProps = {
  data: AdminDashboardData;
};

export function AdminDashboardView({ data }: AdminDashboardViewProps) {
  const t = useTranslations("dashboard");
  const statusT = useTranslations("orderStatus");
  const paymentT = useTranslations("paymentStatus");
  const locale = useLocale();

  const statItems = [
    { label: t("totalOrders"), value: data.stats.totalOrders, icon: Package },
    { label: t("pendingOrders"), value: data.stats.pendingOrders, icon: ClipboardList, accent: "accent" as const },
    {
      label: t("revenueThisMonth"),
      value: formatIqd(data.stats.revenueThisMonth, locale),
      icon: CreditCard,
      accent: "primary" as const,
    },
    { label: t("activeStudents"), value: data.stats.activeStudents, icon: GraduationCap },
    { label: t("designing"), value: data.stats.designing, icon: Palette },
    { label: t("printing"), value: data.stats.printing, icon: Printer },
    { label: t("unpaid"), value: data.stats.unpaid, icon: CreditCard, accent: "accent" as const },
    { label: t("deliveredToday"), value: data.stats.deliveredToday, icon: Package, accent: "primary" as const },
  ];

  const chartData = data.ordersByStatus.map((row) => ({
    ...row,
    label: statusT(row.status),
  }));

  const paymentData = [
    { name: paymentT("paid"), value: data.paymentOverview.paid },
    { name: paymentT("partial"), value: data.paymentOverview.partial },
    { name: paymentT("unpaid"), value: data.paymentOverview.unpaid },
  ];

  return (
    <div className="stack-section">
      <StatsCards items={statItems} />

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5 xl:col-span-2">
          <h2 className="section-title mb-4">{t("ordersByStatus")}</h2>
          <OrdersStatusChart data={chartData} emptyLabel={t("noChartData")} />
        </div>
        <div className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="section-title mb-4">{t("paymentOverview")}</h2>
          <PaymentOverviewChart data={paymentData} emptyLabel={t("noChartData")} />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="section-title mb-4">{t("recentOrders")}</h2>
          <RecentOrders orders={data.recentOrders} emptyLabel={t("noRecentOrders")} />
        </div>
        <div className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="section-title mb-4">{t("readyForDelivery")}</h2>
          <RecentOrders orders={data.readyForDelivery} emptyLabel={t("noDeliveryQueue")} />
        </div>
      </div>
    </div>
  );
}
