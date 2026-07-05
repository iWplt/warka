"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { Product, ProductType } from "@/types/database";
import { BUNDLE_SLOT_LABELS } from "@/lib/bundles/slots";
import { formatIqd } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

type BundleProductPickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: ProductType;
  products: Product[];
  selectedId: string | null;
  onSelect: (productId: string) => void;
  locale: "ar" | "en";
};

export function BundleProductPickerModal({
  open,
  onOpenChange,
  productType,
  products,
  selectedId,
  onSelect,
  locale,
}: BundleProductPickerModalProps) {
  const isAr = locale === "ar";
  const label = BUNDLE_SLOT_LABELS[productType][isAr ? "ar" : "en"];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] flex max-h-[min(88dvh,640px)] w-[min(calc(100vw-1.5rem),520px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-warka-border bg-card shadow-tint-lg outline-none">
          <div className="flex items-start justify-between gap-3 border-b border-warka-border px-4 py-3">
            <div>
              <Dialog.Title className="text-base font-bold text-warka-text">
                {isAr ? `اختر ${label}` : `Choose ${label}`}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-warka-text-muted">
                {isAr
                  ? "من منتجاتك الفعلية في المتجر — السعر والصورة من الكatalog"
                  : "From your real store products — price and image from catalog"}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warka-bg text-warka-text"
              aria-label={isAr ? "إغلاق" : "Close"}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {products.length === 0 ? (
              <p className="py-8 text-center text-sm text-warka-text-muted">
                {isAr
                  ? "لا توجد منتجات من هذا النوع — أضفها من إدارة المنتجات أولاً"
                  : "No products of this type — add them in product management first"}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product) => {
                  const selected = selectedId === product.id;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        onSelect(product.id);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex gap-3 rounded-xl border-2 p-3 text-start transition-colors",
                        selected
                          ? "border-warka-primary bg-warka-primary/5"
                          : "border-warka-border bg-card hover:border-warka-primary/40"
                      )}
                    >
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-media-bg">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-xs text-warka-text-muted">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-warka-text">
                          {isAr ? product.name_ar : product.name_en}
                        </p>
                        <p className="mt-1 text-sm font-bold text-warka-primary">
                          {formatIqd(Number(product.price), locale)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
