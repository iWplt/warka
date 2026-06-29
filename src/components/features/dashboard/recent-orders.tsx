"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { OrderStatusBadge } from "@/components/shared";
import { formatIqd } from "@/lib/format/currency";
import type { DashboardRecentOrder } from "@/server/actions/dashboard";

type RecentOrdersProps = {
  orders: DashboardRecentOrder[];
  basePath?: string;
  emptyLabel: string;
};

export function RecentOrders({
  orders,
  basePath = "/admin/orders",
  emptyLabel,
}: RecentOrdersProps) {
  const t = useTranslations();
  const statusT = useTranslations("orderStatus");
  const locale = useLocale();

  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-3 py-2 text-start">{t("orders.orderNumber")}</th>
            <th className="px-3 py-2 text-start">{t("roles.student")}</th>
            <th className="px-3 py-2 text-start">{t("common.status")}</th>
            <th className="px-3 py-2 text-start">{t("common.total")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-3">
                <Link
                  href={`${basePath}/${order.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {order.order_number}
                </Link>
              </td>
              <td className="px-3 py-3">{order.student_name ?? "N/A"}</td>
              <td className="px-3 py-3">
                <OrderStatusBadge
                  status={order.status}
                  label={statusT(order.status)}
                />
              </td>
              <td className="px-3 py-3 tabular-nums">
                {formatIqd(order.total, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
