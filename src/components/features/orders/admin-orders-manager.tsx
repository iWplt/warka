"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { OrdersTable } from "@/components/features/orders/orders-table";
import { ORDER_STATUS_OPTIONS } from "@/components/features/orders/order-status-select";
import type { OrderStatus, OrderType } from "@/types/database";

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  type: OrderType;
  total: number;
  created_at: string;
  profiles?: { full_name: string; phone: string } | null;
};

type AdminOrdersManagerProps = {
  orders: OrderRow[];
  showArchived?: boolean;
};

const ALL_STATUSES = ORDER_STATUS_OPTIONS;

export function AdminOrdersManager({
  orders,
  showArchived = false,
}: AdminOrdersManagerProps) {
  const t = useTranslations("orders");
  const statusT = useTranslations("orderStatus");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;
      if (typeFilter && order.type !== typeFilter) return false;
      if (!debouncedSearch) return true;

      const query = debouncedSearch.toLowerCase();
      const student = order.profiles?.full_name?.toLowerCase() ?? "";
      return (
        order.order_number.toLowerCase().includes(query) || student.includes(query)
      );
    });
  }, [orders, statusFilter, typeFilter, debouncedSearch]);

  return (
    <div className="stack-section">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !showArchived
              ? "bg-warka-primary text-white"
              : "bg-warka-bg text-warka-text-secondary hover:bg-warka-bg/80"
          }`}
        >
          {t("activeOrders")}
        </Link>
        <Link
          href="/admin/orders?archived=true"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            showArchived
              ? "bg-warka-primary text-white"
              : "bg-warka-bg text-warka-text-secondary hover:bg-warka-bg/80"
          }`}
        >
          {t("archivedOrders")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="max-w-[200px]"
        >
          <option value="">{t("filterAllStatuses")}</option>
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusT(status)}
            </option>
          ))}
        </Select>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="max-w-[180px]"
        >
          <option value="">{t("filterAllTypes")}</option>
          <option value="individual">{t("typeIndividual")}</option>
          <option value="group">{t("typeGroup")}</option>
        </Select>
      </div>

      <OrdersTable orders={filtered} basePath="/admin/orders" canChangeStatus />
    </div>
  );
}
