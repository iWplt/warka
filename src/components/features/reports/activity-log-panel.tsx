"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const KNOWN_ACTIONS = [
  "create_order",
  "status_change",
  "cancel_order",
  "archive_order",
  "unarchive_order",
  "add_note",
  "design_update",
  "upload_design_preview",
  "record_payment",
  "create_user",
  "create_student_account",
] as const;

type ActivityEntry = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
};

type ActivityLogPanelProps = {
  activity: ActivityEntry[];
};

export function ActivityLogPanel({ activity }: ActivityLogPanelProps) {
  const t = useTranslations("activity");
  const orderT = useTranslations("orders");

  if (activity.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="space-y-2">
      {activity.map((entry) => {
        const label = KNOWN_ACTIONS.includes(entry.action as typeof KNOWN_ACTIONS[number])
          ? t(`actions.${entry.action}` as `actions.${typeof KNOWN_ACTIONS[number]}`)
          : entry.action;
        const link = entityLink(entry);

        return (
          <li
            key={entry.id}
            className="flex flex-col gap-1 rounded-lg bg-white/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {entry.profiles?.full_name ?? "—"} — {label}
              </p>
              {link && (
                <Link href={link} className="text-xs text-primary hover:underline">
                  {orderT("viewOrder")}
                </Link>
              )}
            </div>
            <time className="shrink-0 text-xs text-muted-foreground">
              {new Date(entry.created_at).toLocaleString()}
            </time>
          </li>
        );
      })}
    </ul>
  );
}

function entityLink(entry: ActivityEntry): string | null {
  if (!entry.entity_type || !entry.entity_id) return null;
  if (entry.entity_type === "order") return `/admin/orders/${entry.entity_id}`;
  return null;
}
