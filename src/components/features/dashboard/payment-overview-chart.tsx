"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "var(--color-primary)",
  "var(--color-muted-foreground)",
  "var(--color-border)",
];

const CHART_BORDER = "var(--color-border)";
const CHART_CARD = "var(--color-card)";
const CHART_FOREGROUND = "var(--color-foreground)";

type PaymentOverviewChartProps = {
  data: Array<{ name: string; value: number }>;
  emptyLabel: string;
};

export function PaymentOverviewChart({ data, emptyLabel }: PaymentOverviewChartProps) {
  const filtered = data.filter((row) => row.value > 0);
  const total = filtered.reduce((sum, row) => sum + row.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={3}
          >
            {filtered.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: CHART_CARD,
              border: `1px solid ${CHART_BORDER}`,
              borderRadius: 12,
              color: CHART_FOREGROUND,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-4 space-y-2">
        {filtered.map((row, index) => (
          <li key={row.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: COLORS[index % COLORS.length] }}
              />
              {row.name}
            </span>
            <span className="font-medium tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
