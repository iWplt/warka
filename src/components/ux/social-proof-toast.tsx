"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingBag } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const INITIAL_DELAY_MS = 14_000;
const ROTATE_INTERVAL_MS = 55_000;
const VISIBLE_DURATION_MS = 5_000;

type SocialProofMessage = {
  ar: string;
  en: string;
};

const MESSAGES: SocialProofMessage[] = [
  { ar: "سارة من بغداد طلبت وشاح تخرج للتو", en: "Sara from Baghdad just ordered a graduation sash" },
  { ar: "علي من البصرة أضاف روب تخرج إلى سلته", en: "Ali from Basra added a graduation gown to cart" },
  { ar: "نور من أربيل أكملت طلب قبعة تخرج", en: "Noor from Erbil completed a cap order" },
  { ar: "محمد من النجف يتصفح بدلات التخرج الآن", en: "Mohammed from Najaf is browsing graduation suits" },
  { ar: "زينب من الموصل طلبت تصميم مخصص", en: "Zainab from Mosul ordered a custom design" },
  { ar: "حسين من كربلاء اشترى حزمة تخرج كاملة", en: "Hussein from Karbala bought a full graduation bundle" },
];

export function SocialProofToast() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const message = useMemo(
    () => (isAr ? MESSAGES[index].ar : MESSAGES[index].en),
    [index, isAr]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const show = () => {
      setVisible(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setVisible(false), VISIBLE_DURATION_MS);
    };

    const initialTimer = setTimeout(show, INITIAL_DELAY_MS);
    const rotateTimer = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
      show();
    }, ROTATE_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(rotateTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [mounted]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "social-proof-toast animate-fade-in fixed inset-x-3 z-[55] mx-auto max-w-sm font-arabic",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]",
        "md:inset-x-auto md:bottom-5 md:start-4 md:end-auto"
      )}
    >
      <div className="flex items-center gap-2.5 p-3">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warka-primary/20">
          <span className="social-proof-live-dot" aria-hidden />
          <ShoppingBag className="h-3.5 w-3.5 text-warka-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-warka-primary">
            {isAr ? "طلب مباشر" : "Live order"}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-warka-text">
            {message}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
