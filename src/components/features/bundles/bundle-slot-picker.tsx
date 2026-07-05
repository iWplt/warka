"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, Package } from "lucide-react";
import type { Product, ProductType } from "@/types/database";
import {
  activeSlotTypes,
  BUNDLE_SLOT_LABELS,
  type BundleSlotSelections,
  productsByType,
} from "@/lib/bundles/slots";
import { formatIqd } from "@/lib/format/currency";
import { BundleProductPickerModal } from "@/components/features/bundles/bundle-product-picker-modal";
import { cn } from "@/lib/utils";

type BundleSlotPickerProps = {
  catalog: Product[];
  selections: BundleSlotSelections;
  onChange: (selections: BundleSlotSelections) => void;
  locale: "ar" | "en";
  compact?: boolean;
  className?: string;
};

export function BundleSlotPicker({
  catalog,
  selections,
  onChange,
  locale,
  compact = false,
  className,
}: BundleSlotPickerProps) {
  const isAr = locale === "ar";
  const byType = useMemo(() => productsByType(catalog), [catalog]);
  const slotTypes = useMemo(() => activeSlotTypes(catalog), [catalog]);
  const [pickerType, setPickerType] = useState<ProductType | null>(null);

  const setSlot = (type: ProductType, productId: string) => {
    onChange({ ...selections, [type]: productId });
  };

  const clearSlot = (type: ProductType) => {
    const next = { ...selections };
    delete next[type];
    onChange(next);
  };

  if (slotTypes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-warka-border bg-warka-bg/50 p-4 text-sm text-warka-text-muted">
        {isAr
          ? "لا توجد منتجات نشطة في المتجر — أضف وشاح/قبعة/روب من إدارة المنتجات"
          : "No active store products — add sash/cap/gown in product management"}
      </p>
    );
  }

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {slotTypes.map((type) => {
          const options = byType.get(type) ?? [];
          const selectedId = selections[type] ?? null;
          const selected = selectedId
            ? options.find((p) => p.id === selectedId) ?? catalog.find((p) => p.id === selectedId)
            : null;
          const label = BUNDLE_SLOT_LABELS[type][isAr ? "ar" : "en"];

          return (
            <div
              key={type}
              className={cn(
                "rounded-xl border border-warka-border bg-card",
                compact ? "p-3" : "p-4"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-warka-text">{label}</p>
                {selected && (
                  <button
                    type="button"
                    onClick={() => clearSlot(type)}
                    className="text-xs font-medium text-destructive hover:underline"
                  >
                    {isAr ? "إزالة" : "Remove"}
                  </button>
                )}
              </div>

              {selected ? (
                <button
                  type="button"
                  onClick={() => setPickerType(type)}
                  className="flex w-full items-center gap-3 rounded-lg border border-warka-primary/30 bg-warka-primary/5 p-2.5 text-start transition-colors hover:bg-warka-primary/10"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-media-bg">
                    {selected.image ? (
                      <Image
                        src={selected.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-warka-primary">
                        <Package className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-warka-text">
                      {isAr ? selected.name_ar : selected.name_en}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-warka-primary">
                      {formatIqd(Number(selected.price), locale)}
                    </p>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-warka-text-muted rtl:rotate-180" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickerType(type)}
                  className="flex w-full min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-warka-primary/40 px-4 py-3 text-sm font-semibold text-warka-primary transition-colors hover:bg-warka-primary/5"
                >
                  {isAr ? `اختر ${label} من منتجاتك` : `Pick ${label} from your products`}
                  <ChevronDown className="size-4 rtl:rotate-180" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {pickerType && (
        <BundleProductPickerModal
          open={pickerType !== null}
          onOpenChange={(open) => !open && setPickerType(null)}
          productType={pickerType}
          products={byType.get(pickerType) ?? []}
          selectedId={selections[pickerType] ?? null}
          onSelect={(id) => setSlot(pickerType, id)}
          locale={locale}
        />
      )}
    </>
  );
}
