"use client";

import type { WarkaFont } from "@/lib/settings/types";
import { resolveEmbroideryDisplayName, type DiacriticsMode } from "@/lib/arabic/harakat";
import { cn } from "@/lib/utils";

type EmbroideryLivePreviewProps = {
  baseName: string;
  diacriticsMode: DiacriticsMode;
  fontFamily?: string | null;
  fonts?: WarkaFont[];
  locale: "ar" | "en";
  className?: string;
  embedded?: boolean;
};

export function EmbroideryLivePreview({
  baseName,
  diacriticsMode,
  fontFamily,
  fonts = [],
  locale,
  className,
  embedded = false,
}: EmbroideryLivePreviewProps) {
  const isAr = locale === "ar";
  const displayName =
    resolveEmbroideryDisplayName(baseName, diacriticsMode) || (isAr ? "اسمك" : "Your name");
  const fontLabel = fonts.find((f) => f.font_family_css === fontFamily);

  return (
    <div
      className={cn(
        embedded
          ? "overflow-hidden rounded-xl border border-warka-border bg-gradient-to-b from-card to-warka-bg"
          : "relative overflow-hidden rounded-2xl border-2 border-warka-border bg-gradient-to-b from-warka-bg to-warka-accent/30 shadow-inner",
        className
      )}
    >
      <div
        className={cn(
          "border-b border-warka-border/50 px-4 py-3",
          embedded ? "bg-warka-bg/60" : "bg-card/80"
        )}
      >
        <p className="text-sm font-semibold text-warka-text">
          {isAr ? "معاينة تقريبية للاسم والخط" : "Approximate name & font preview"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-warka-text-muted">
          {isAr
            ? "تشوف شلون راح يطلع اسمك بالخط المختار — مو صورة المنتج النهائي."
            : "See how your name looks in the chosen font — not the final product photo."}
        </p>
      </div>

      <div className="relative flex min-h-[140px] flex-col items-center justify-center px-4 py-6 sm:min-h-[180px] sm:px-6 sm:py-8">
        <p
          className="max-w-full break-words text-center text-2xl leading-relaxed text-warka-text sm:text-4xl"
          style={{ fontFamily: fontFamily ? `"${fontFamily}", serif` : "serif" }}
          dir="rtl"
        >
          {displayName}
        </p>

        {fontFamily && (
          <p className="mt-3 text-xs text-warka-text-muted">
            {isAr ? "الخط:" : "Font:"}{" "}
            {fontLabel ? (isAr ? fontLabel.name_ar : fontLabel.name_en || fontLabel.name_ar) : fontFamily}
          </p>
        )}

        {!fontFamily && (
          <p className="mt-4 text-center text-xs text-warka-text-muted">
            {isAr ? "اختر خطاً من الأعلى لتظهر المعاينة" : "Pick a font above to preview"}
          </p>
        )}
      </div>
    </div>
  );
}
