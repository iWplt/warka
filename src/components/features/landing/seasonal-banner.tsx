"use client";

import { useEffect, useState } from "react";
import { GraduationCap, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "warka-seasonal-banner-dismissed";

export function SeasonalBanner() {
  const t = useTranslations("landing.seasonalBanner");
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className={cn(
        "relative border-b border-warka-primary/20 bg-warka-primary/10 px-4 py-2.5 text-center",
        !reducedMotion && "animate-fade-in"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 pe-8">
        <GraduationCap className="hidden h-4 w-4 shrink-0 text-warka-primary sm:block" aria-hidden />
        <p className="text-xs font-medium text-warka-text sm:text-sm">{t("message")}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-1/2 end-3 -translate-y-1/2 rounded-md p-1 text-warka-text-muted transition-colors hover:bg-warka-accent/20 hover:text-warka-text"
        aria-label={t("dismiss")}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
