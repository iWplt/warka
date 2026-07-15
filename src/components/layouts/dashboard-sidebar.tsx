"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Palette,
  Printer,
  Truck,
  CreditCard,
  BarChart3,
  LayoutDashboard,
  Users,
  Settings,
  FileImage,
  Package,
  GraduationCap,
  Grid3x3,
  UserCircle,
  X,
  LogOut,
  MapPin,
  Bell,
  KeyRound,
  Type,
  Sparkles,
  Gift,
  Ruler,
  Layers,
  Wallet,
  MessageCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { Profile, UserRole } from "@/types/database";
import { useUiStore } from "@/stores/ui-store";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { signOut } from "@/server/actions/auth";

type NavLabelKey =
  | "dashboard"
  | "orders"
  | "design"
  | "templates"
  | "printing"
  | "delivery"
  | "payments"
  | "users"
  | "batches"
  | "reports"
  | "settings"
  | "products"
  | "students"
  | "tracking"
  | "newOrder"
  | "myOrders"
  | "profile"
  | "addresses"
  | "notifications"
  | "invites"
  | "fonts"
  | "sizes"
  | "bundles"
  | "customization"
  | "embroideryOrders"
  | "paymentMethods"
  | "messages";

type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  icon: React.ComponentType<{ className?: string }>;
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", labelKey: "orders", icon: ClipboardList },
  { href: "/admin/products", labelKey: "products", icon: Package },
  { href: "/admin/bundles", labelKey: "bundles", icon: Gift },
  { href: "/admin/customization", labelKey: "customization", icon: Layers },
  { href: "/admin/sizes", labelKey: "sizes", icon: Ruler },
  { href: "/admin/fonts", labelKey: "fonts", icon: Type },
  { href: "/admin/design", labelKey: "design", icon: Palette },
  { href: "/admin/templates", labelKey: "templates", icon: FileImage },
  { href: "/admin/printing", labelKey: "printing", icon: Printer },
  { href: "/admin/delivery", labelKey: "delivery", icon: Truck },
  { href: "/admin/payments", labelKey: "payments", icon: CreditCard },
  { href: "/admin/payment-methods", labelKey: "paymentMethods", icon: Wallet },
  { href: "/admin/messages", labelKey: "messages", icon: MessageCircle },
  { href: "/admin/users", labelKey: "users", icon: Users },
  { href: "/admin/invites", labelKey: "invites", icon: KeyRound },
  { href: "/admin/batches", labelKey: "batches", icon: Package },
  { href: "/admin/reports", labelKey: "reports", icon: BarChart3 },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
];

const REP_NAV: NavItem[] = [
  { href: "/representative", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/representative/batches", labelKey: "students", icon: GraduationCap },
  { href: "/representative/orders", labelKey: "orders", icon: ClipboardList },
  { href: "/representative/tracking", labelKey: "tracking", icon: Grid3x3 },
  { href: "/notifications", labelKey: "notifications", icon: Bell },
  { href: "/representative/profile", labelKey: "profile", icon: UserCircle },
];

const STUDENT_NAV: NavItem[] = [
  { href: "/student", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/checkout", labelKey: "newOrder", icon: Package },
  { href: "/student/orders", labelKey: "myOrders", icon: ClipboardList },
  { href: "/student/tracking", labelKey: "tracking", icon: Grid3x3 },
  { href: "/notifications", labelKey: "notifications", icon: Bell },
  { href: "/student/addresses", labelKey: "addresses", icon: MapPin },
  { href: "/student/profile", labelKey: "profile", icon: UserCircle },
];

const EMPLOYEE_NAV: NavItem[] = [
  { href: "/employee", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/employee/orders", labelKey: "orders", icon: ClipboardList },
  { href: "/employee/printing", labelKey: "printing", icon: Printer },
];

const EMBROIDERY_NAV: NavItem[] = [
  { href: "/embroidery", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/embroidery/orders", labelKey: "embroideryOrders", icon: Sparkles },
  { href: "/notifications", labelKey: "notifications", icon: Bell },
];

function navForRole(role: UserRole): NavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "employee") return EMPLOYEE_NAV;
  if (role === "representative") return REP_NAV;
  if (role === "student") return STUDENT_NAV;
  if (role === "embroidery") return EMBROIDERY_NAV;
  return [];
}

const PORTAL_SUBTITLES: Record<UserRole, string> = {
  admin: "لوحة المدير",
  employee: "بوابة الموظف",
  representative: "بوابة الممثل",
  student: "بوابة الطالب",
  embroidery: "ورشة التطريز",
};

type DashboardSidebarProps = {
  role: UserRole;
  profile: Profile;
};

export function DashboardSidebar({ role, profile }: DashboardSidebarProps) {
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const [mounted, setMounted] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  const navItems = navForRole(role);
  const isPending = (href: string) => pendingHref === href && pathname !== href;
  const collapsed = mounted && isDesktop && sidebarCollapsed;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isDesktop || !mobileSidebarOpen) return;
    setMobileSidebarOpen(false);
  }, [mounted, isDesktop, mobileSidebarOpen, setMobileSidebarOpen]);

  const handleNavigate = (href: string) => {
    setPendingHref(href);
    setMobileSidebarOpen(false);
  };

  const sidebarInner = (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-white/10 p-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link href={`/${role}`} className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          {collapsed ? (
            <BrandLockup variant="dark" layout="mark" className="h-10 w-10" priority />
          ) : (
            <div className="overflow-hidden">
              <BrandLockup
                variant="dark"
                layout="header"
                className="[&_span]:text-white [&_.text-warka-text-muted]:text-white/75"
              />
              <div className="mt-1 text-[11px] leading-tight text-white/80">{PORTAL_SUBTITLES[role]}</div>
            </div>
          )}
        </Link>
        {mounted && !isDesktop && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu"
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      <nav className="scrollbar-hide flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            pathname={pathname}
            label={tNav(item.labelKey)}
            collapsed={collapsed}
            pending={isPending(item.href)}
            onNavigate={() => handleNavigate(item.href)}
          />
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        {!collapsed && (
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warka-primary-light text-xs font-bold text-white">
              {mounted ? profile.full_name.charAt(0) : ""}
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-xs font-medium text-white" suppressHydrationWarning>
                {profile.full_name}
              </p>
              <p className="truncate text-caption text-white/75" suppressHydrationWarning>
                {profile.email}
              </p>
            </div>
          </div>
        )}
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className={cn(
              "flex w-full min-h-9 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-red-300",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? tCommon("logout") : undefined}
          >
            <LogOut className="size-5 shrink-0" />
            {!collapsed && <span className="truncate">{tCommon("logout")}</span>}
          </button>
        </form>
      </div>
    </>
  );

  const widthClass = mounted && collapsed ? "w-[4.5rem]" : "w-72";

  return (
    <>
      {/* Desktop: in-flow column beside main content */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col bg-warka-sidebar text-white lg:flex lg:sticky lg:top-0 lg:h-screen",
          widthClass
        )}
        aria-label="Dashboard navigation"
      >
        {sidebarInner}
      </aside>

      {/* Mobile: drawer overlay */}
      {mounted && !isDesktop && mobileSidebarOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu overlay"
          />
          <aside
            className="fixed inset-y-0 start-0 z-50 flex w-72 flex-col bg-warka-sidebar text-white shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
            aria-label="Mobile navigation"
          >
            {sidebarInner}
          </aside>
        </>
      )}
    </>
  );
}

type SidebarNavItemProps = {
  item: NavItem;
  pathname: string;
  label: string;
  collapsed: boolean;
  pending: boolean;
  onNavigate: () => void;
};

function SidebarNavItem({
  item,
  pathname,
  label,
  collapsed,
  pending,
  onNavigate,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const active =
    pathname === item.href ||
    (item.href !== "/admin" &&
      item.href !== "/employee" &&
      item.href !== "/representative" &&
      item.href !== "/student" &&
      pathname.startsWith(`${item.href}/`));

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-9 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "border-e-2 border-white bg-white/15 text-white"
          : "text-white/90 hover:bg-white/10 hover:text-white",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className={cn("size-5 shrink-0", pending && "opacity-50")} aria-hidden />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
