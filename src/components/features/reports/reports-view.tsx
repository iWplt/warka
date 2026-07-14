"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ReportsExportPanel } from "./reports-export-panel";
import { ActivityLogPanel } from "./activity-log-panel";

type ReportsViewProps = {
  byStatus: Record<string, number>;
  activity: Array<{
    id: string;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    created_at: string;
    profiles?: { full_name: string } | null;
  }>;
};

type Tab = "overview" | "activity" | "export";

export function ReportsView({ byStatus, activity }: ReportsViewProps) {
  const t = useTranslations("reports");
  const statusT = useTranslations("orderStatus");
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: t("overviewTab") },
    { id: "activity", label: t("activityTab") },
    { id: "export", label: t("exportTab") },
  ];

  return (
    <div className="stack-section">
      <div className="flex flex-wrap gap-2 border-b border-glass-border pb-4">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-foreground/5 text-muted-foreground hover:bg-warka-bg/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="mb-4 font-semibold">{t("byStatus")}</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex justify-between rounded-lg bg-foreground/5 p-3 text-sm"
              >
                <span>{statusT(status as never)}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="mb-4 font-semibold">{t("adminActivity")}</h2>
          <ActivityLogPanel activity={activity} />
        </div>
      )}

      {tab === "export" && <ReportsExportPanel />}
    </div>
  );
}
