"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WarkaCard } from "@/components/ui/warka-card";
import { OrderStatusBadge } from "@/components/shared";
import { updateOrderStatus } from "@/server/actions/orders";
import type { OrderStatus } from "@/types/database";

type KanbanOrder = {
  id: string;
  order_number: string;
  status: OrderStatus;
  profiles?: { full_name: string; phone: string } | null;
};

type KanbanColumns = {
  pending: KanbanOrder[];
  approved: KanbanOrder[];
  printing: KanbanOrder[];
  ready: KanbanOrder[];
  delivered: KanbanOrder[];
};

type PrintingKanbanProps = {
  columns: KanbanColumns;
};

type ColumnKey = keyof KanbanColumns;

const COLUMN_KEYS: ColumnKey[] = [
  "pending",
  "approved",
  "printing",
  "ready",
  "delivered",
];

function nextStatus(column: ColumnKey, current: OrderStatus): OrderStatus | null {
  switch (column) {
    case "pending":
      return "ready_for_printing";
    case "approved":
      return "printing";
    case "printing":
      if (current === "printing") return "printed";
      if (current === "printed") return "ready_for_delivery";
      return "ready_for_delivery";
    case "ready":
      return "delivered";
    case "delivered":
      return null;
    default:
      return null;
  }
}

export function PrintingKanban({ columns }: PrintingKanbanProps) {
  const lifecycleT = useTranslations("studentOrder.lifecycle");
  const statusT = useTranslations("orderStatus");
  const ordersT = useTranslations("orders");
  const commonT = useTranslations("common");
  const router = useRouter();
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const columnTitle: Record<ColumnKey, string> = {
    pending: lifecycleT("pending"),
    approved: lifecycleT("approved"),
    printing: lifecycleT("printing"),
    ready: lifecycleT("ready"),
    delivered: lifecycleT("delivered"),
  };

  const handleAdvance = async (
    orderId: string,
    column: ColumnKey,
    currentStatus: OrderStatus
  ) => {
    const next = nextStatus(column, currentStatus);
    if (!next) return;

    setAdvancingId(orderId);
    try {
      await updateOrderStatus(orderId, next);
      toast.success(commonT("success"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : commonT("error"));
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMN_KEYS.map((columnKey) => {
        const orders = columns[columnKey];
        return (
          <div
            key={columnKey}
            className="flex w-72 shrink-0 flex-col rounded-2xl border border-warka-border bg-warka-bg/60"
          >
            <div className="border-b border-warka-border px-4 py-3">
              <h2 className="font-semibold text-warka-text">{columnTitle[columnKey]}</h2>
              <p className="text-xs text-warka-text-secondary">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-3">
              {orders.length === 0 ? (
                <p className="rounded-xl border border-dashed border-warka-border px-3 py-8 text-center text-sm text-warka-text-secondary">
                  {commonT("noResults")}
                </p>
              ) : (
                orders.map((order) => {
                  const next = nextStatus(columnKey, order.status);
                  return (
                    <WarkaCard key={order.id} className="p-4">
                      <p className="font-semibold text-warka-text">{order.order_number}</p>
                      <p className="mt-1 text-sm text-warka-text-secondary">
                        {order.profiles?.full_name ?? "—"}
                      </p>
                      <div className="mt-3">
                        <OrderStatusBadge
                          status={order.status}
                          label={statusT(order.status)}
                        />
                      </div>
                      {next && columnKey !== "delivered" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="accent"
                          className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl"
                          disabled={advancingId === order.id}
                          onClick={() => handleAdvance(order.id, columnKey, order.status)}
                        >
                          {ordersT("changeStatus")}
                          <ChevronRight className="size-4" aria-hidden />
                        </Button>
                      )}
                    </WarkaCard>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
