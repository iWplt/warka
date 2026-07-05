"use client";

import { useEffect, useState } from "react";
import { Lock, Ruler } from "lucide-react";
import { WarkaCard } from "@/components/ui/warka-card";
import { Label } from "@/components/ui/label";
import { SizeGuide } from "@/components/ux/size-guide";
import { getSizeOptionsFromGuide } from "@/lib/cart/sizes";
import {
  getSizePolicy,
  isOneSizeProduct,
  oneSizeLabel,
  showsCustomMeasurements,
  showsFixedSizeList,
  showsSizeEstimate,
  type ProductSizePolicy,
} from "@/lib/settings/size-policies";
import type { SizeGuideEntry } from "@/lib/settings/types";
import type { ProductType } from "@/types/database";
import { cn } from "@/lib/utils";

type SizeSelectorFieldProps = {
  productType: ProductType;
  policies: Record<ProductType, ProductSizePolicy>;
  sizeGuideEntries: SizeGuideEntry[];
  size: string;
  customMeasurements: string;
  onSizeChange: (size: string) => void;
  onCustomMeasurementsChange: (value: string) => void;
  locale: "ar" | "en";
  /** Field locked by batch/rep — show read-only */
  locked?: boolean;
  lockedValue?: string;
  className?: string;
};

export function SizeSelectorField({
  productType,
  policies,
  sizeGuideEntries,
  size,
  customMeasurements,
  onSizeChange,
  onCustomMeasurementsChange,
  locale,
  locked = false,
  lockedValue,
  className,
}: SizeSelectorFieldProps) {
  const isAr = locale === "ar";
  const policy = getSizePolicy(policies, productType);
  const [guideOpen, setGuideOpen] = useState(false);

  const fixedSizes = showsFixedSizeList(policy)
    ? getSizeOptionsFromGuide(sizeGuideEntries, productType, locale)
    : [];

  useEffect(() => {
    if (locked || size.trim()) return;
    if (isOneSizeProduct(policy)) {
      onSizeChange(oneSizeLabel(policy, locale));
    }
  }, [locked, locale, onSizeChange, policy, size]);

  if (locked && lockedValue) {
    return (
      <div className={cn("rounded-xl border border-warka-border bg-warka-bg/60 px-3 py-2.5 opacity-90", className)}>
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-warka-text-muted">
          <Lock className="size-3.5" />
          {isAr ? "المقاس (مقفول من الدفعة)" : "Size (locked by batch)"}
        </p>
        <p className="mt-1 text-sm font-semibold text-warka-text">{lockedValue}</p>
      </div>
    );
  }

  if (isOneSizeProduct(policy)) {
    const label = oneSizeLabel(policy, locale);
    return (
      <WarkaCard className={cn("space-y-2", className)}>
        <Label>{isAr ? "المقاس" : "Size"}</Label>
        <p className="rounded-xl border border-warka-primary/25 bg-warka-primary/5 px-4 py-3 text-sm font-semibold text-warka-text">
          {label}
        </p>
        <p className="text-xs text-warka-text-muted">
          {isAr
            ? "هذا المنتج بمقاس موحّد — يحدده الممثل أو الإدارة للدفعة."
            : "This product uses one standard size — set by rep or admin for the batch."}
        </p>
      </WarkaCard>
    );
  }

  return (
    <WarkaCard className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{isAr ? "المقاس" : "Size"}</Label>
        {showsSizeEstimate(policy) && (
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warka-primary/40 px-3 py-1.5 text-xs font-semibold text-warka-primary hover:bg-warka-primary/10"
          >
            <Ruler className="size-3.5" />
            {isAr ? "تخمين المقاس (طول/وزن)" : "Estimate size (height/weight)"}
          </button>
        )}
      </div>

      {fixedSizes.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {fixedSizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSizeChange(s)}
              className={cn(
                "rounded-xl border-2 py-2.5 text-sm font-bold transition-colors",
                size === s
                  ? "border-warka-primary bg-warka-primary text-white"
                  : "border-warka-border text-warka-text hover:border-warka-primary/50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {showsCustomMeasurements(policy) && (
        <div>
          <Label className="mb-1 block">
            {isAr ? "أو أدخل قياساتك المخصصة" : "Or enter custom measurements"}
          </Label>
          <textarea
            value={customMeasurements}
            onChange={(e) => onCustomMeasurementsChange(e.target.value)}
            rows={3}
            placeholder={
              isAr
                ? "مثال: طول 178 سم، محيط صدر 98 سم، طول كم 62 سم…"
                : "e.g. height 178 cm, chest 98 cm, sleeve 62 cm…"
            }
            className="w-full rounded-xl border border-warka-border bg-card px-3 py-2 text-sm"
            dir="auto"
          />
          <p className="mt-1 text-xs text-warka-text-muted">
            {isAr
              ? "استخدم هذا إذا ما يناسبك المقاسات الجاهزة."
              : "Use this when preset sizes do not fit."}
          </p>
        </div>
      )}

      {policy.mode === "custom" && fixedSizes.length === 0 && (
        <p className="text-sm text-warka-text-secondary">
          {isAr ? "أدخل قياساتك بالتفصيل أدناه." : "Enter your measurements in detail below."}
        </p>
      )}

      <SizeGuide
        open={guideOpen}
        onOpenChange={setGuideOpen}
        locale={locale}
        entries={sizeGuideEntries}
        productType={productType}
        onSelectSize={(label) => {
          onSizeChange(label);
          setGuideOpen(false);
        }}
      />
    </WarkaCard>
  );
}
