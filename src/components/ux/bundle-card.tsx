"use client";



import { useMemo, useState } from "react";

import Image from "next/image";

import { Package, Pencil } from "lucide-react";

import type { Product, ProductType } from "@/types/database";

import {

  activeSlotTypes,

  BUNDLE_SLOT_LABELS,

  type BundleSlotSelections,

  resolveProductsFromSlots,

} from "@/lib/bundles/slots";

import { formatIqd } from "@/lib/format/currency";

import { BundleProductPickerModal } from "@/components/features/bundles/bundle-product-picker-modal";

import { cn } from "@/lib/utils";



export type BundleItem = {

  id: string;

  name: string;

  image: string;

  productType?: ProductType;

};



type BundleCardProps = {

  title: string;

  items: BundleItem[];

  originalPrice: number;

  bundlePrice: number;

  locale: "ar" | "en";

  catalog?: Product[];

  slotSelections?: BundleSlotSelections;

  onSlotChange?: (selections: BundleSlotSelections) => void;

  onAddBundle?: () => void;

  className?: string;

  /** Bundle cannot currently be turned into a valid cart (missing/inactive products). */
  unavailable?: boolean;

  /** Add-in-progress (persist + navigation) — disables the button and shows feedback. */
  pending?: boolean;

};



export function BundleCard({

  title,

  items,

  originalPrice,

  bundlePrice,

  locale,

  catalog,

  slotSelections,

  onSlotChange,

  onAddBundle,

  className,

  unavailable = false,

  pending = false,

}: BundleCardProps) {

  const isAr = locale === "ar";

  const savings = Math.max(0, originalPrice - bundlePrice);

  const savingsPercent =

    originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;



  const customizable = Boolean(catalog?.length && slotSelections && onSlotChange);

  const [pickerType, setPickerType] = useState<ProductType | null>(null);



  const productsByTypeMap = useMemo(() => {

    const map = new Map<ProductType, Product[]>();

    for (const p of catalog ?? []) {

      const list = map.get(p.product_type) ?? [];

      list.push(p);

      map.set(p.product_type, list);

    }

    return map;

  }, [catalog]);



  const displayItems = useMemo(() => {

    if (!customizable || !slotSelections || !catalog) return items;

    return activeSlotTypes(catalog)

      .map((type) => {

        const id = slotSelections[type];

        const product = id ? catalog.find((p) => p.id === id) : null;

        if (!product) return null;

        return {

          id: product.id,

          name: isAr ? product.name_ar : product.name_en,

          image: product.image ?? "",

          productType: type,

        };

      })

      .filter(Boolean) as BundleItem[];

  }, [catalog, customizable, isAr, items, slotSelections]);



  return (

    <>

      <div

        className={cn(

          "flex gap-4 overflow-hidden rounded-2xl border border-warka-border bg-warka-surface p-4 shadow-card transition-all hover:shadow-tint-lg",

          className

        )}

      >

        <div className="flex shrink-0 flex-col gap-2">

          {displayItems.slice(0, 4).map((item) => (

            <button

              key={item.id}

              type="button"

              disabled={!customizable || !item.productType}

              onClick={() => item.productType && setPickerType(item.productType)}

              className={cn(

                "group relative size-16 overflow-hidden rounded-xl border-2 border-card bg-media-bg shadow-sm",

                customizable && item.productType && "cursor-pointer hover:border-warka-primary"

              )}

              title={

                customizable && item.productType

                  ? isAr

                    ? `غيّر ${BUNDLE_SLOT_LABELS[item.productType].ar}`

                    : `Change ${BUNDLE_SLOT_LABELS[item.productType].en}`

                  : item.name

              }

            >

              {item.image ? (

                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />

              ) : (

                <div className="flex size-full items-center justify-center text-warka-primary">

                  <Package className="size-6" />

                </div>

              )}

              {customizable && item.productType && (

                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-black/55 py-0.5 text-[9px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">

                  <Pencil className="size-2.5" />

                  {isAr ? "تغيير" : "Change"}

                </span>

              )}

            </button>

          ))}

          {displayItems.length === 0 && (

            <div className="flex size-16 items-center justify-center rounded-xl bg-warka-bg text-warka-primary">

              <Package className="size-6" />

            </div>

          )}

        </div>



        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-start justify-between gap-2">

            <h3 className="font-bold text-warka-text">{title}</h3>

            {savings > 0 && (

              <span

                className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"

                style={{ backgroundColor: "#4CAF50" }}

              >

                {isAr ? `وفر ${savingsPercent}%` : `Save ${savingsPercent}%`}

              </span>

            )}

          </div>



          <p className="mt-1 line-clamp-2 text-xs text-warka-text-muted">

            {displayItems.map((i) => i.name).join(isAr ? " + " : " + ")}

          </p>



          {customizable && (

            <p className="mt-1 text-[11px] font-medium text-warka-primary">

              {isAr

                ? "اضغط على أي قطعة لتبديلها من منتجاتك"

                : "Tap any item to swap from your catalog"}

            </p>

          )}



          <div className="mt-2 flex flex-wrap items-baseline gap-2">

            <span className="text-lg font-bold text-warka-primary">

              {formatIqd(bundlePrice, locale)}

            </span>

            {savings > 0 && (

              <span className="text-sm text-warka-text-muted line-through">

                {formatIqd(originalPrice, locale)}

              </span>

            )}

          </div>



          {unavailable ? (

            <button

              type="button"

              disabled

              aria-disabled="true"

              className="mt-3 min-h-10 cursor-not-allowed rounded-lg border border-warka-border bg-warka-bg px-4 py-2 text-xs font-semibold text-warka-text-muted"

            >

              {isAr ? "قريباً" : "Coming soon"}

            </button>

          ) : (

            onAddBundle && (

              <button

                type="button"

                onClick={onAddBundle}

                disabled={pending}

                aria-busy={pending}

                className="mt-3 min-h-10 rounded-lg bg-warka-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-warka-primary-dark disabled:opacity-60"

              >

                {pending

                  ? isAr

                    ? "جارٍ الإضافة…"

                    : "Adding…"

                  : isAr

                    ? "أضف الباقة"

                    : "Add bundle"}

              </button>

            )

          )}

        </div>

      </div>



      {customizable && pickerType && catalog && slotSelections && onSlotChange && (

        <BundleProductPickerModal

          open={pickerType !== null}

          onOpenChange={(open) => !open && setPickerType(null)}

          productType={pickerType}

          products={productsByTypeMap.get(pickerType) ?? []}

          selectedId={slotSelections[pickerType] ?? null}

          onSelect={(id) => onSlotChange({ ...slotSelections, [pickerType]: id })}

          locale={locale}

        />

      )}

    </>

  );

}

