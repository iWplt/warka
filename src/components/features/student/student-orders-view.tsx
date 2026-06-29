"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Package, Plus } from "lucide-react";
import { OrdersTable } from "@/components/features/orders/orders-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type { OrderStatus } from "@/types/database";
import { cn } from "@/lib/utils";

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  type: "individual" | "group";
  total: number;
  created_at: string;
  profiles?: { full_name: string; phone: string } | null;
};

type StudentOrdersViewProps = {
  orders: OrderRow[];
};

const TABS: { id: "all" | OrderStatus; labelAr: string; labelEn: string }[] = [
  { id: "all", labelAr: "الكل", labelEn: "All" },
  { id: "pending_review", labelAr: "قيد المراجعة", labelEn: "Review" },
  { id: "printing", labelAr: "قيد الطباعة", labelEn: "Printing" },
  { id: "ready_for_delivery", labelAr: "قيد التسليم", labelEn: "Delivery" },
  { id: "delivered", labelAr: "تم التسليم", labelEn: "Delivered" },
];

export function StudentOrdersView({ orders }: StudentOrdersViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [tab, setTab] = useState<"all" | OrderStatus>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    if (tab === "printing") {
      return orders.filter((o) => ["printing", "printed", "ready_for_printing"].includes(o.status));
    }
    return orders.filter((o) => o.status === tab);
  }, [orders, tab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.myOrders")}
        actions={
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 rounded-xl bg-warka-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-warka-primary-dark"
          >
            <Plus className="h-4 w-4" />
            {t("nav.newOrder")}
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "bg-warka-primary text-white"
                : "border border-warka-border text-warka-text-secondary hover:border-warka-primary/40"
            )}
          >
            {locale === "ar" ? item.labelAr : item.labelEn}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("student.noOrders")}
          description={t("studentOrder.noProductsHint")}
          action={
            <Link
              href="/checkout"
              className="rounded-xl bg-warka-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t("nav.newOrder")}
            </Link>
          }
        />
      ) : (
        <OrdersTable orders={filtered} basePath="/student/orders" hideStudentColumn />
      )}
    </div>
  );
}
