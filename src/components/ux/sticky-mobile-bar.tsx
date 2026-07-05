"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { formatIqd } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

type StickyMobileBarProps = {
  targetRef: React.RefObject<HTMLElement | null>;
  price: number;
  locale: "ar" | "en";
  onAddToCart: () => void;
  addLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function StickyMobileBar({
  targetRef,
  price,
  locale,
  onAddToCart,
  addLabel,
  disabled,
  className,
}: StickyMobileBarProps) {
  const [visible, setVisible] = useState(false);
  const isAr = locale === "ar";

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-40 border-t border-warka-border bg-card/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md transition-transform duration-300 md:bottom-0 md:hidden",
        visible ? "translate-y-0" : "translate-y-full",
        className
      )}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
        <div>
          <p className="text-xs text-warka-text-muted">
            {isAr ? "السعر" : "Price"}
          </p>
          <p className="text-lg font-bold text-warka-primary">
            {formatIqd(price, locale)}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onAddToCart}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-warka-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark disabled:opacity-50"
        >
          <ShoppingBag className="size-4" />
          {addLabel ?? (isAr ? "أضف للسلة" : "Add to cart")}
        </button>
      </div>
    </div>
  );
}
