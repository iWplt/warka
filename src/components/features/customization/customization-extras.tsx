"use client";

import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { DecorationUploadField } from "@/components/features/embroidery/decoration-upload-field";
import type { ProductType } from "@/types/database";

type CustomizationExtrasProps = {
  locale: "ar" | "en";
  productType: ProductType;
  decorationUrl: string | null;
  onDecorationChange: (url: string | null) => void;
  capSideUrl?: string | null;
  capTopUrl?: string | null;
  onCapSideChange?: (url: string | null) => void;
  onCapTopChange?: (url: string | null) => void;
  showCustomReference?: boolean;
  customReferenceUrl?: string | null;
  onCustomReferenceChange?: (url: string | null) => void;
  className?: string;
};

export function CustomizationExtras({
  locale,
  productType,
  decorationUrl,
  onDecorationChange,
  capSideUrl,
  capTopUrl,
  onCapSideChange,
  onCapTopChange,
  showCustomReference,
  customReferenceUrl,
  onCustomReferenceChange,
  className,
}: CustomizationExtrasProps) {
  const isAr = locale === "ar";
  const isCap = productType === "cap";

  return (
    <WarkaCard className={className}>
      <WarkaCardTitle className="mb-3 text-base">
        {isAr ? "الزخرفة ورفع الصور" : "Decoration & image uploads"}
      </WarkaCardTitle>
      <p className="mb-4 text-xs text-warka-text-muted">
        {isAr
          ? "ارفع صورة مرجعية للزخرفة أو النقشة — متاح لكل الطلبات (فردية أو دفعة)."
          : "Upload reference images for motifs and embroidery — available for all orders."}
      </p>

      <div className="space-y-4">
        <DecorationUploadField
          imageUrl={decorationUrl}
          onChange={onDecorationChange}
          locale={locale}
          label={isAr ? "صورة الزخرفة / التطريز (مرجع)" : "Decoration / embroidery reference"}
        />

        {showCustomReference && onCustomReferenceChange && (
          <DecorationUploadField
            imageUrl={customReferenceUrl ?? null}
            onChange={onCustomReferenceChange}
            locale={locale}
            label={isAr ? "صورة الطلب الخاص (حسب صورة)" : "Custom order reference photo"}
          />
        )}

        {isCap && onCapSideChange && onCapTopChange && (
          <>
            <DecorationUploadField
              imageUrl={capSideUrl ?? null}
              onChange={onCapSideChange}
              locale={locale}
              label={isAr ? "مرجع التطريز الجانبي (الطوق)" : "Side band embroidery reference"}
            />
            <DecorationUploadField
              imageUrl={capTopUrl ?? null}
              onChange={onCapTopChange}
              locale={locale}
              label={isAr ? "مرجع التطريز العلوي" : "Top embroidery reference"}
            />
          </>
        )}
      </div>
    </WarkaCard>
  );
}
