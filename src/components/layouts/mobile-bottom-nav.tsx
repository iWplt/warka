"use client";

import { Home, Package, ShoppingCart, ClipboardList, User } from "lucide-react";
import { usePathname } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { getDashboardPath } from "@/lib/auth/permissions";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: typeof Home;
  labelAr: string;
  labelEn: string;
};

function buildNav(profile: Profile | null): NavItem[] {
  if (!profile) {
    return [
      { href: "/", icon: Home, labelAr: "الرئيسية", labelEn: "Home" },
      { href: "/products", icon: Package, labelAr: "المنتجات", labelEn: "Products" },
      { href: "/cart", icon: ShoppingCart, labelAr: "السلة", labelEn: "Cart" },
      { href: "/login", icon: ClipboardList, labelAr: "الطلبات", labelEn: "Orders" },
      { href: "/login", icon: User, labelAr: "حسابي", labelEn: "Account" },
    ];
  }

  const dashboard = getDashboardPath(profile.role);
  const ordersHref =
    profile.role === "student"
      ? "/student/orders"
      : profile.role === "representative"
        ? "/representative/orders"
        : profile.role === "employee"
          ? "/employee/orders"
          : "/admin/orders";

  return [
    { href: "/", icon: Home, labelAr: "الرئيسية", labelEn: "Home" },
    { href: "/products", icon: Package, labelAr: "المنتجات", labelEn: "Products" },
    {
      href: "/cart",
      icon: ShoppingCart,
      labelAr: "السلة",
      labelEn: "Cart",
    },
    { href: ordersHref, icon: ClipboardList, labelAr: "الطلبات", labelEn: "Orders" },
    { href: dashboard, icon: User, labelAr: "حسابي", labelEn: "Account" },
  ];
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname === "";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type MobileBottomNavProps = {
  profile?: Profile | null;
};

export function MobileBottomNav({ profile = null }: MobileBottomNavProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const nav = buildNav(profile);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-warka-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          const label = locale === "ar" ? item.labelAr : item.labelEn;

          return (
            <Link
              key={`${item.href}-${item.labelAr}`}
              href={item.href}
              prefetch
              className={cn(
                "flex min-h-[56px] flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors active:scale-[0.98]",
                active ? "text-warka-primary" : "text-warka-text-secondary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
