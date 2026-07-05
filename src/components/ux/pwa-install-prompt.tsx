"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "warka-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PWAInstallPromptProps = {
  /** When true, wait before showing so it does not compete with hero CTAs */
  delayOnHomepage?: boolean;
};

export function PWAInstallPrompt({ delayOnHomepage = false }: PWAInstallPromptProps) {
  const locale = useLocale();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    let showTimer: ReturnType<typeof setTimeout> | undefined;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      const prompt = event as BeforeInstallPromptEvent;
      const reveal = () => {
        setDeferredPrompt(prompt);
        setVisible(true);
      };
      if (delayOnHomepage) {
        showTimer = setTimeout(reveal, 18_000);
      } else {
        reveal();
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      if (showTimer) clearTimeout(showTimer);
    };
  }, [delayOnHomepage]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDeferredPrompt(null);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setVisible(false);

    if (outcome === "dismissed") {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }, [deferredPrompt]);

  const title =
    locale === "ar"
      ? "أضف WARKA إلى شاشتك الرئيسية"
      : "Add WARKA to your home screen";

  const actionLabel = locale === "ar" ? "تثبيت" : "Install";

  return (
    <AnimatePresence>
      {visible && deferredPrompt ? (
        <motion.div
          role="dialog"
          aria-label={title}
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[60] mx-auto max-w-lg rounded-xl border border-warka-border bg-card p-4 font-arabic shadow-card md:bottom-6"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warka-primary/10">
              <Download className="h-5 w-5 text-warka-primary" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-warka-text">{title}</p>
              <p className="mt-1 text-xs text-warka-text-secondary">
                {locale === "ar"
                  ? "وصول أسرع وتجربة أفضل بدون متصفح"
                  : "Faster access and a better experience without the browser"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={install}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-warka-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {actionLabel}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 text-sm font-medium text-warka-text-secondary transition-colors hover:bg-warka-bg"
                >
                  {locale === "ar" ? "لاحقاً" : "Later"}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 rounded-lg p-1 text-warka-text-muted transition-colors hover:bg-warka-bg hover:text-warka-text"
              aria-label={locale === "ar" ? "إغلاق" : "Dismiss"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
