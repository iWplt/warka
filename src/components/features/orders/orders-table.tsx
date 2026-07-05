"use client";

import { useTranslations } from "next-intl";
import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import { OrderStatusBadge } from "@/components/shared";
import { formatIqd } from "@/lib/format/currency";
import type { OrderStatus, OrderType } from "@/types/database";

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  type: OrderType;
  total: number;
  created_at: string;
  student_modified_at?: string | null;
  profiles?: { full_name: string; phone: string } | null;
};

type OrdersTableProps = {
  orders: OrderRow[];
  basePath: string;
  hideStudentColumn?: boolean;
};

export function OrdersTable({ orders, basePath, hideStudentColumn = false }: OrdersTableProps) {
  const t = useTranslations();
  const statusT = useTranslations("orderStatus");
  const locale = useLocale();

  const columns: ColumnDef<OrderRow, unknown>[] = [
    {
      accessorKey: "order_number",
      header: t("orders.orderNumber"),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <Link
            href={`${basePath}/${row.original.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.order_number}
          </Link>
          {"student_modified_at" in row.original && row.original.student_modified_at && (
            <span className="w-fit rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              {locale === "ar" ? "معدّل" : "Edited"}
            </span>
          )}
        </div>
      ),
    },
    ...(hideStudentColumn
      ? []
      : [
          {
            id: "student",
            header: t("roles.student"),
            cell: ({ row }: { row: { original: OrderRow } }) =>
              row.original.profiles?.full_name ?? "—",
          },
        ]),
    {
      accessorKey: "type",
      header: t("orders.type"),
      cell: ({ row }) =>
        row.original.type === "group" ? t("orders.typeGroup") : t("orders.typeIndividual"),
    },
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ row }) => (
        <OrderStatusBadge
          status={row.original.status}
          label={statusT(row.original.status)}
        />
      ),
    },
    {
      accessorKey: "total",
      header: t("common.total"),
      cell: ({ row }) => formatIqd(Number(row.original.total), locale),
    },
    {
      accessorKey: "created_at",
      header: t("common.date"),
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString(locale),
    },
  ];

  return <DataTable columns={columns} data={orders} searchKey="order_number" />;
}
