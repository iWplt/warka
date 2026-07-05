"use client";

import Image from "next/image";
import { Ruler, Sparkles } from "lucide-react";
import { WarkaCard } from "@/components/ui/warka-card";
import { formatIqd } from "@/lib/format/currency";
import { getSizeOptions, productNeedsSize } from "@/lib/cart/sizes";
import type { ProductColorVariant, ProductFabricOption, ProductType } from "@/types/database";
import { cn } from "@/lib/utils";

type ProductOptionsPickerProps = {
  colorVariants: ProductColorVariant[];
  fabricOptions: ProductFabricOption[];
  selectedColorKey: string;
  selectedFabricKey: string;
  onColorChange: (key: string) => void;
  onFabricChange: (key: string) => void;
  locale: string;
  productType?: ProductType;
  selectedSize?: string;
  onSizeChange?: (size: string) => void;
  onOpenSizeGuide?: () => void;
  sizeOptions?: string[];
  hideSizeSection?: boolean;
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
  productType,
  selectedSize = "",
  onSizeChange,
  onOpenSizeGuide,
  sizeOptions,
  hideSizeSection = false,
  className,
}: ProductOptionsPickerProps) {
  const isAr = locale === "ar";
  const selectedFabric =
    fabricOptions.find((f) => f.key === selectedFabricKey) ?? fabricOptions[0];
  const sizes =
    sizeOptions ??
    (productType && productNeedsSize(productType)
      ? getSizeOptions(productType, isAr ? "ar" : "en")
      : []);

  return (
    <WarkaCard className={cn("space-y-6", className)}>
      <div>
        <h2 className="mb-1 text-sm font-semibold text-warka-text">
          {isAr ? "تخصيص المنتج" : "Customize product"}
        </h2>
        <p className="text-xs text-warka-text-muted">
          {isAr
            ? "اختر اللون والقماش والمقاس قبل الإضافة للسلة"
            : "Choose color, fabric, and size before adding to cart"}
        </p>
      </div>

      {colorVariants.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-warka-text">
            {isAr ? "١. لون المنتج" : "1. Product color"}
          </h3>
          <div className="flex max-h-48 flex-wrap gap-3 overflow-y-auto pe-1">
            {colorVariants.map((variant) => {
              const label = isAr ? variant.label_ar : variant.label_en;
              return (
                <button
                  key={variant.key}
                  type="button"
                  onClick={() => onColorChange(variant.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-[10px] border-2 px-3 py-2 text-sm font-medium transition-colors",
                    selectedColorKey === variant.key
                      ? "border-warka-primary bg-warka-primary/10 text-warka-text"
                      : "border-warka-border text-warka-text-secondary hover:border-warka-primary/40"
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
        </div>
      )}

      {fabricOptions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-warka-text">
            {isAr ? "٢. نوع القماش" : "2. Fabric type"}
          </h3>
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
                      ? "border-warka-primary bg-warka-primary/10"
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
        </div>
      )}

      {sizes.length > 0 && onSizeChange && !hideSizeSection && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-warka-text">
              {isAr ? "٣. المقاس *" : "3. Size *"}
            </h3>
            {onOpenSizeGuide && (
              <button
                type="button"
                onClick={onOpenSizeGuide}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-warka-primary hover:underline"
              >
                <Ruler className="size-3.5" />
                {isAr ? "دليل المقاسات" : "Size guide"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSizeChange(size)}
                className={cn(
                  "rounded-xl border-2 py-2.5 text-sm font-bold transition-colors",
                  selectedSize === size
                    ? "border-warka-primary bg-warka-primary text-white"
                    : "border-warka-border bg-card text-warka-text hover:border-warka-primary/50"
                )}
              >
                {size}
              </button>
            ))}
          </div>
          {!selectedSize && (
            <p className="mt-2 text-xs text-warka-text-muted">
              {isAr ? "اختر مقاسك قبل الإضافة للسلة" : "Select your size before adding to cart"}
            </p>
          )}
        </div>
      )}

      {selectedFabric?.image && fabricOptions.length > 0 && (
        <p className="text-xs text-warka-text-muted">
          {isAr ? "معاينة القماش المختار أعلاه" : "Selected fabric preview shown above"}
        </p>
      )}
    </WarkaCard>
  );
}
