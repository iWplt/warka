"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { WarkaCard } from "@/components/ui/warka-card";
import { formatIqd } from "@/lib/format/currency";
import type { ProductColorVariant, ProductFabricOption } from "@/types/database";
import { cn } from "@/lib/utils";

type ProductOptionsPickerProps = {
  colorVariants: ProductColorVariant[];
  fabricOptions: ProductFabricOption[];
  selectedColorKey: string;
  selectedFabricKey: string;
  onColorChange: (key: string) => void;
  onFabricChange: (key: string) => void;
  locale: string;
  className?: string;
};

export function ProductOptionsPicker({
  colorVariants,
  fabricOptions,
  selectedColorKey,
  selectedFabricKey,
  onColorChange,
  onFabricChange,
  locale,
  className,
}: ProductOptionsPickerProps) {
  const isAr = locale === "ar";
  const selectedFabric =
    fabricOptions.find((f) => f.key === selectedFabricKey) ?? fabricOptions[0];

  return (
    <div className={cn("space-y-4", className)}>
      {colorVariants.length > 0 && (
        <WarkaCard>
          <h2 className="mb-3 text-sm font-semibold text-warka-text">
            {isAr ? "لون المنتج" : "Product color"}
          </h2>
          <div className="flex max-h-48 flex-wrap gap-3 overflow-y-auto pe-1">
            {colorVariants.map((variant) => {
              const label = isAr ? variant.label_ar : variant.label_en;
              return (
                <button
                  key={variant.key}
                  type="button"
                  onClick={() => onColorChange(variant.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-[10px] border-2 px-3 py-2 text-sm transition-colors",
                    selectedColorKey === variant.key
                      ? "border-warka-primary bg-warka-primary/5"
                      : "border-warka-border hover:border-warka-primary/40"
                  )}
                >
                  <span
                    className="size-5 rounded-full border border-warka-border"
                    style={{ backgroundColor: variant.hex }}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </WarkaCard>
      )}

      {fabricOptions.length > 0 && (
        <WarkaCard>
          <h2 className="mb-3 text-sm font-semibold text-warka-text">
            {isAr ? "نوع القماش" : "Fabric type"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {fabricOptions.map((fabric) => {
              const label = isAr ? fabric.label_ar : fabric.label_en;
              const desc = isAr ? fabric.description_ar : fabric.description_en;
              const isPremium = fabric.key === "premium";
              const isSelected = selectedFabricKey === fabric.key;

              return (
                <button
                  key={fabric.key}
                  type="button"
                  onClick={() => onFabricChange(fabric.key)}
                  className={cn(
                    "overflow-hidden rounded-[14px] border-2 text-start transition-colors",
                    isSelected
                      ? "border-warka-primary bg-warka-primary/5"
                      : "border-warka-border hover:border-warka-primary/40"
                  )}
                >
                  {fabric.image && (
                    <div className="relative aspect-[16/10] w-full bg-warka-bg">
                      <Image
                        src={fabric.image}
                        alt={label}
                        fill
                        className="object-cover"
                        sizes="240px"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      {isPremium && (
                        <Sparkles className="size-4 shrink-0 text-warka-primary" />
                      )}
                      <span className="text-sm font-semibold text-warka-text">{label}</span>
                    </div>
                    {fabric.price_adjustment > 0 && (
                      <p className="mt-1 text-xs font-medium text-warka-primary">
                        +{formatIqd(fabric.price_adjustment, locale)}
                      </p>
                    )}
                    {desc && (
                      <p className="mt-2 text-xs leading-relaxed text-warka-text-secondary">
                        {desc}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedFabric?.image && (
            <p className="mt-3 text-xs text-warka-text-muted">
              {isAr ? "معاينة القماش المختار أعلاه" : "Selected fabric preview shown above"}
            </p>
          )}
        </WarkaCard>
      )}
    </div>
  );
}
