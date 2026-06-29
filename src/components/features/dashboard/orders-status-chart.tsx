"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OrderStatus } from "@/types/database";

const CHART_BORDER = "var(--color-border)";
const CHART_MUTED = "var(--color-muted-foreground)";
const CHART_PRIMARY = "var(--color-primary)";
const CHART_CARD = "var(--color-card)";
const CHART_FOREGROUND = "var(--color-foreground)";

type OrdersStatusChartProps = {
  data: Array<{ status: OrderStatus; count: number; label: string }>;
  emptyLabel: string;
};

export function OrdersStatusChart({ data, emptyLabel }: OrdersStatusChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_BORDER} />
          <XAxis type="number" allowDecimals={false} stroke={CHART_MUTED} />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            stroke={CHART_MUTED}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: CHART_CARD,
              border: `1px solid ${CHART_BORDER}`,
              borderRadius: 12,
              color: CHART_FOREGROUND,
            }}
          />
          <Bar dataKey="count" fill={CHART_PRIMARY} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
