"use client";

import Image from "next/image";
import { GitCompareArrows, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CompareItem = {
  id: string;
  name: string;
  image: string;
};

type CompareBarProps = {
  items: CompareItem[];
  maxItems?: number;
  locale: "ar" | "en";
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
  className?: string;
};

export function CompareBar({
  items,
  maxItems = 3,
  locale,
  onRemove,
  onClear,
  onCompare,
  className,
}: CompareBarProps) {
  const isAr = locale === "ar";
  const visible = items.length > 0;

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-warka-border bg-card/95 px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md",
        "animate-in slide-in-from-bottom-4 duration-300",
        className
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-warka-text">
            <GitCompareArrows className="size-4 text-warka-primary" />
            {isAr ? "مقارنة" : "Compare"}
            <span className="rounded-full bg-warka-primary/10 px-2 py-0.5 text-xs text-warka-primary">
              {items.length}/{maxItems}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative flex shrink-0 items-center gap-2 rounded-xl border border-warka-border bg-warka-bg/40 pe-2"
              >
                <div className="relative size-10 overflow-hidden rounded-l-xl bg-media-bg">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <span className="max-w-[100px] truncate text-xs font-medium text-warka-text">
                  {item.name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="flex size-6 items-center justify-center rounded-full text-warka-text-muted hover:bg-warka-bg hover:text-warka-text"
                  aria-label={isAr ? "إزالة" : "Remove"}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-warka-border px-3 py-2 text-xs font-semibold text-warka-text-secondary hover:bg-warka-bg"
          >
            {isAr ? "مسح الكل" : "Clear all"}
          </button>
          <button
            type="button"
            onClick={onCompare}
            disabled={items.length < 2}
            className="rounded-lg bg-warka-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-warka-primary-dark disabled:opacity-50"
          >
            {isAr ? "قارن الآن" : "Compare now"}
          </button>
        </div>
      </div>
    </div>
  );
}
