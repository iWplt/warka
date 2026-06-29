"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";

const SEGMENT_KEYS: Record<string, string> = {
  admin: "nav.dashboard",
  representative: "nav.dashboard",
  student: "nav.dashboard",
  orders: "nav.orders",
  batches: "nav.batches",
  design: "nav.design",
  templates: "nav.templates",
  printing: "nav.printing",
  delivery: "nav.delivery",
  payments: "nav.payments",
  users: "nav.users",
  reports: "nav.reports",
  settings: "nav.settings",
  students: "nav.students",
  tracking: "nav.tracking",
  profile: "nav.profile",
  new: "nav.newOrder",
};

export function DashboardBreadcrumbs() {
  const t = useTranslations();
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return (
      <p className="text-sm font-medium text-foreground">{t("nav.dashboard")}</p>
    );
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    const labelKey = SEGMENT_KEYS[segment];
    const label = labelKey
      ? t(labelKey)
      : segment.length > 12
        ? `${segment.slice(0, 8)}…`
        : segment;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="size-3.5 text-muted-foreground rtl:rotate-180" />
          )}
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
