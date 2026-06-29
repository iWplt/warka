"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={pathname}
      locale={nextLocale}
      className={cn(
        "inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-xs font-semibold text-warka-text-secondary transition-colors hover:bg-warka-bg hover:text-warka-text touch-manipulation",
        className
      )}
    >
      {locale === "ar" ? "EN" : "عربي"}
    </Link>
  );
}
