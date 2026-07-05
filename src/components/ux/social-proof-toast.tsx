"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingBag } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const INITIAL_DELAY_MS = 2_500;
const ROTATE_INTERVAL_MS = 45_000;
const VISIBLE_DURATION_MS = 6_000;

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
        "social-proof-toast animate-fade-in fixed inset-x-4 z-[90] mx-auto max-w-md font-arabic",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]",
        "md:inset-x-auto md:bottom-6 md:start-4 md:end-auto md:max-w-sm"
      )}
    >
      <div className="flex items-start gap-3 p-3.5 sm:p-4">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warka-primary/25">
          <span className="social-proof-live-dot" aria-hidden />
          <ShoppingBag className="h-4 w-4 text-warka-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-warka-primary sm:text-xs">
            {isAr ? "طلب مباشر الآن" : "Live order"}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-warka-text sm:text-[0.9375rem]">
            {message}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
