"use client";

import { useLocale } from "next-intl";
import { Clock, User } from "lucide-react";

type EditLogEntry = {
  id: string;
  action: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  profiles?: { full_name: string } | null;
};

type OrderStudentEditLogProps = {
  entries: EditLogEntry[];
};

export function OrderStudentEditLog({ entries }: OrderStudentEditLogProps) {
  const locale = useLocale() as "ar" | "en";
  const isAr = locale === "ar";

  const edits = entries.filter((e) => e.action === "student_order_edit");
  if (edits.length === 0) return null;

  return (
    <div className="rounded-2xl glass p-6">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <Clock className="size-4 text-primary" />
        {isAr ? "سجل تعديلات الطالب" : "Student edit history"}
      </h2>
      <ul className="space-y-3">
        {edits.map((entry) => (
          <li
            key={entry.id}
            className="rounded-xl border border-glass-border bg-foreground/[0.03] px-3 py-2.5 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <User className="size-3.5 text-primary" />
              <span className="font-semibold">
                {entry.profiles?.full_name ?? (isAr ? "الطالب" : "Student")}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString(locale)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr ? "تم تحديث الحقول الشخصية" : "Personal fields updated"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
