"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Search, ShoppingCart, User, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { WARKA_MARK_PATH, WARKA_TAGLINE_AR, WARKA_TAGLINE_EN } from "@/lib/constants/brand";
import { getDashboardPath } from "@/lib/auth/permissions";
import type { Profile } from "@/types/database";
import { signOut } from "@/server/actions/auth";
import { LanguageSwitcher } from "@/components/layouts/language-switcher";
import { SmartSearch } from "@/components/ux/smart-search";
import { CartBadge } from "@/components/features/cart/cart-badge";
import { CART_PULSE_EVENT } from "@/lib/cart/cart-pulse";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  profile: Profile | null;
};

const headerIconClass =
  "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-warka-text-secondary transition-colors hover:bg-warka-bg hover:text-warka-text touch-manipulation";

export function SiteHeader({ profile }: SiteHeaderProps) {
  const t = useTranslations("landing.nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [smartSearchOpen, setSmartSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartPulsing, setCartPulsing] = useState(false);
  const reducedMotion = useReducedMotion();
  const tagline = locale === "ar" ? WARKA_TAGLINE_AR : WARKA_TAGLINE_EN;

  useEffect(() => {
    if (reducedMotion) return;

    let pulseTimer: ReturnType<typeof setTimeout> | undefined;

    const onCartPulse = () => {
      if (pulseTimer) clearTimeout(pulseTimer);
      setCartPulsing(true);
      pulseTimer = setTimeout(() => setCartPulsing(false), 400);
    };

    window.addEventListener(CART_PULSE_EVENT, onCartPulse);
    return () => {
      window.removeEventListener(CART_PULSE_EVENT, onCartPulse);
      if (pulseTimer) clearTimeout(pulseTimer);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/#home", label: t("home") },
    { href: "/products", label: t("products") },
    { href: "/bulk-order", label: locale === "ar" ? "طلب جماعي" : "Bulk order" },
    { href: "/#how-it-works", label: t("howItWorks") },
    { href: "/#contact", label: t("contact") },
  ];

  const dashboardPath = profile ? getDashboardPath(profile.role) : "/login";
  const cartHref = "/cart";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-warka-border bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid h-16 grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[auto_1fr_auto] md:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 justify-self-start">
            <Image
              src={WARKA_MARK_PATH}
              alt="WARKA"
              width={44}
              height={44}
              className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
              priority
            />
            <div className="hidden min-w-0 flex-col sm:flex">
              <span className="font-display text-xl font-bold tracking-[0.12em] text-warka-text">
                WARKA
              </span>
              <span className="-mt-0.5 truncate text-[10px] text-warka-text-muted">{tagline}</span>
            </div>
          </Link>

          <nav className="hidden items-center justify-center gap-6 lg:gap-8 md:flex" aria-label="Main">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-warka-text-secondary transition-colors duration-200 hover:text-warka-text"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1 justify-self-end">
            <button
              type="button"
              onClick={() => setSmartSearchOpen(true)}
              className={cn(headerIconClass, "hidden sm:inline-flex")}
              aria-label={tCommon("search")}
            >
              <Search className="h-5 w-5" />
            </button>

            <SmartSearch
              open={smartSearchOpen}
              onOpenChange={setSmartSearchOpen}
              locale={locale === "ar" ? "ar" : "en"}
            />

            <Link
              href={cartHref}
              prefetch
              className={cn(
                headerIconClass,
                cartPulsing && !reducedMotion && "scale-110 transition-transform duration-300"
              )}
              aria-label={locale === "ar" ? "السلة" : "Cart"}
            >
              <ShoppingCart className="h-5 w-5" />
              <CartBadge />
            </Link>

            <LanguageSwitcher />

            {profile ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className={headerIconClass}
                  aria-label={tCommon("login")}
                >
                  <User className="h-5 w-5" />
                </button>
                {userMenuOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                      aria-label="Close menu"
                    />
                    <div className="absolute end-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-warka-border bg-card font-arabic shadow-card">
                      <div className="border-b border-warka-border px-3 py-2 text-sm font-medium text-warka-text">
                        {profile.full_name}
                      </div>
                      <Link
                        href={dashboardPath}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-warka-text-secondary hover:bg-warka-bg hover:text-warka-text"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {tCommon("dashboard")}
                      </Link>
                      <form action={signOut}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-warka-bg"
                        >
                          <LogOut className="h-4 w-4" />
                          {tCommon("logout")}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden h-10 shrink-0 items-center whitespace-nowrap rounded-lg bg-warka-primary px-5 text-sm font-medium text-white transition-colors hover:bg-warka-primary-dark sm:inline-flex"
              >
                {tCommon("login")}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={cn(headerIconClass, "md:hidden")}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/40 md:hidden"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          />
          <nav
            className="fixed inset-x-0 top-16 z-[61] max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-warka-border bg-card shadow-lg md:hidden"
            aria-label="Mobile"
          >
            <div className="space-y-1 px-4 py-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="block min-h-[44px] rounded-lg px-3 py-3 text-sm font-medium text-warka-text-secondary transition-colors hover:bg-warka-bg hover:text-warka-text"
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSmartSearchOpen(true);
                  closeMobileMenu();
                }}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-warka-text-secondary transition-colors hover:bg-warka-bg hover:text-warka-text sm:hidden"
              >
                <Search className="h-4 w-4" />
                {tCommon("search")}
              </button>
              {!profile ? (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block min-h-[44px] rounded-lg px-3 py-3 text-sm font-medium text-warka-primary transition-colors hover:bg-warka-bg"
                >
                  {tCommon("login")}
                </Link>
              ) : (
                <>
                  <Link
                    href={dashboardPath}
                    onClick={closeMobileMenu}
                    className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-warka-text-secondary transition-colors hover:bg-warka-bg hover:text-warka-text"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {tCommon("dashboard")}
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-warka-bg"
                    >
                      <LogOut className="h-4 w-4" />
                      {tCommon("logout")}
                    </button>
                  </form>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
