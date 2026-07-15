"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu, Search, PanelLeftClose, PanelLeft } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/layouts/language-switcher";
import { NotificationBell } from "@/components/features/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { signOut } from "@/server/actions/auth";
import { useUiStore } from "@/stores/ui-store";
import type { Profile } from "@/types/database";
import { DashboardBreadcrumbs } from "./dashboard-breadcrumbs";

type DashboardHeaderProps = {
  profile: Profile;
};

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { sidebarCollapsed, toggleSidebar, toggleMobileSidebar } = useUiStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = mounted
    ? profile.full_name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
    : "";

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-warka-border bg-card/95 px-4 backdrop-blur-sm sm:h-16 sm:gap-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-warka-text-secondary hover:bg-warka-bg hover:text-warka-text lg:hidden"
          onClick={toggleMobileSidebar}
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden shrink-0 text-warka-text-secondary hover:bg-warka-bg hover:text-warka-text lg:inline-flex"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
        <div className="min-w-0">
          <DashboardBreadcrumbs />
        </div>
      </div>

      <div className="hidden max-w-xs flex-1 px-4 md:block">
        <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-warka-border bg-warka-bg px-3 focus-within:border-warka-primary focus-within:ring-2 focus-within:ring-warka-primary/20">
          <Search className="size-4 shrink-0 text-warka-text-muted" aria-hidden />
          <input
            type="search"
            placeholder={locale === "ar" ? "ابحث عن طلب، منتج..." : "Search orders, products..."}
            className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-warka-text outline-none placeholder:text-warka-text-muted"
          />
        </label>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <NotificationBell userId={profile.id} />
        <LanguageSwitcher />
        <div
          className="hidden size-9 items-center justify-center rounded-full bg-warka-primary/15 text-xs font-bold text-warka-primary sm:flex"
          title={profile.full_name}
          aria-hidden
        >
          {initials}
        </div>
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="hidden text-warka-text-secondary hover:bg-warka-bg hover:text-warka-text sm:inline-flex"
          >
            <LogOut className="size-4" />
            {t("common.logout")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="submit"
            className="text-warka-text-secondary hover:bg-warka-bg sm:hidden"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
