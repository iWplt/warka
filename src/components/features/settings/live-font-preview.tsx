"use client";

import { cn } from "@/lib/utils";
import type { WarkaFont } from "@/lib/settings/types";

type LiveFontPreviewProps = {
  fonts: WarkaFont[];
  previewText: string;
  selectedFontFamily?: string | null;
  onSelect?: (fontFamilyCss: string) => void;
  locale: "ar" | "en";
  className?: string;
};

export function LiveFontPreview({
  fonts,
  previewText,
  selectedFontFamily,
  onSelect,
  locale,
  className,
}: LiveFontPreviewProps) {
  const isAr = locale === "ar";
  const text = previewText.trim() || (isAr ? "اسمك" : "Your name");

  if (fonts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-warka-border p-4 text-sm text-warka-text-muted">
        {isAr ? "لا توجد خطوط متاحة حالياً" : "No fonts available yet"}
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {fonts.map((font) => {
        const label = isAr ? font.name_ar : font.name_en || font.name_ar;
        const selected = selectedFontFamily === font.font_family_css;

        return (
          <button
            key={font.id}
            type="button"
            onClick={() => onSelect?.(font.font_family_css)}
            className={cn(
              "w-full rounded-xl border-2 px-4 py-3 text-start transition-colors",
              selected
                ? "border-warka-primary bg-warka-primary/10"
                : "border-warka-border hover:border-warka-primary/40",
              onSelect ? "cursor-pointer" : "cursor-default"
            )}
          >
            <p className="mb-1 text-xs font-medium text-warka-text-muted">{label}</p>
            <p
              className="truncate text-2xl text-warka-text"
              style={{ fontFamily: `"${font.font_family_css}", serif` }}
              dir="auto"
            >
              {text}
            </p>
          </button>
        );
      })}
    </div>
  );
}
