"use client";

import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  HARAKAT_BUTTONS,
  resolveEmbroideryDisplayName,
  type DiacriticsMode,
} from "@/lib/arabic/harakat";
import { cn } from "@/lib/utils";

type NameDiacriticsControlsProps = {
  baseName: string;
  mode: DiacriticsMode;
  onBaseNameChange: (value: string) => void;
  onModeChange: (mode: DiacriticsMode) => void;
  locale: "ar" | "en";
  className?: string;
};

export function NameDiacriticsControls({
  baseName,
  mode,
  onBaseNameChange,
  onModeChange,
  locale,
  className,
}: NameDiacriticsControlsProps) {
  const isAr = locale === "ar";
  const inputRef = useRef<HTMLInputElement>(null);
  const displayName = resolveEmbroideryDisplayName(baseName, mode);

  const insertHaraka = (haraka: string) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? baseName.length;
    const end = el.selectionEnd ?? start;
    const before = baseName.slice(0, start);
    const after = baseName.slice(end);
    const next = `${before}${haraka}${after}`;
    onBaseNameChange(next);
    requestAnimationFrame(() => {
      const pos = start + haraka.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label>{isAr ? "الاسم للتطريز *" : "Name for embroidery *"}</Label>
        <Input
          ref={inputRef}
          value={baseName}
          onChange={(e) => onBaseNameChange(e.target.value)}
          placeholder={
            isAr ? "اكتب اسمك بدون أو مع حركات" : "Type your name with or without harakat"
          }
          className="mt-1 border-warka-border"
          dir="auto"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onModeChange("manual")}
          className={cn(
            "touch-manipulation rounded-xl border-2 px-4 py-3 text-start text-sm transition-colors sm:py-3",
            mode === "manual"
              ? "border-warka-primary bg-warka-primary/10"
              : "border-warka-border hover:border-warka-primary/40"
          )}
        >
          <p className="font-semibold text-warka-text">
            {isAr ? "أكتب الحركات بنفسي" : "I write the harakat myself"}
          </p>
          <p className="mt-1 text-xs text-warka-text-muted">
            {isAr
              ? "اكتب الاسم مع الفتحة والكسرة والشدة كما تريد"
              : "Type your name with fatha, kasra, shadda, etc."}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("auto")}
          className={cn(
            "touch-manipulation rounded-xl border-2 px-4 py-3 text-start text-sm transition-colors sm:py-3",
            mode === "auto"
              ? "border-warka-primary bg-warka-primary/10"
              : "border-warka-border hover:border-warka-primary/40"
          )}
        >
          <p className="font-semibold text-warka-text">
            {isAr ? "أضيفوا الحركات لي (WARKA)" : "Add harakat for me (WARKA)"}
          </p>
          <p className="mt-1 text-xs text-warka-text-muted">
            {isAr
              ? "نضيف الإعراب المناسب للأسماء الشائعة — يمكنك مراجعته قبل الطلب"
              : "We suggest standard diacritics for common names"}
          </p>
        </button>
      </div>

      {mode === "manual" && (
        <div>
          <p className="mb-2 text-xs font-medium text-warka-text-muted">
            {isAr ? "أزرار الحركات — ضع المؤشر بعد الحرف ثم اضغط" : "Harakat — place cursor after a letter"}
          </p>
          <div className="flex flex-wrap gap-2">
            {HARAKAT_BUTTONS.map((h) => (
              <button
                key={h.char}
                type="button"
                onClick={() => insertHaraka(h.char)}
                className="flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg border border-warka-border bg-card px-2 py-2 text-lg leading-none hover:border-warka-primary"
                title={isAr ? h.label : h.en}
              >
                {h.char}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "auto" && baseName.trim() && (
        <div className="rounded-xl border border-warka-primary/20 bg-warka-primary/5 px-4 py-3 text-sm">
          <p className="text-xs text-warka-text-muted">
            {isAr ? "الاسم بعد اقتراح الحركات:" : "Suggested with harakat:"}
          </p>
          <p className="mt-1 text-lg font-semibold text-warka-text" dir="rtl">
            {displayName}
          </p>
        </div>
      )}
    </div>
  );
}
