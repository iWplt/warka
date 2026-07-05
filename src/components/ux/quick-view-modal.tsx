"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { buildDefaultCartItemFromProduct } from "@/lib/cart/build-item";
import { dispatchCartPulse } from "@/lib/cart/cart-pulse";
import { formatIqd } from "@/lib/format/currency";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/database";
import { cn } from "@/lib/utils";

type QuickViewModalProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "ar" | "en";
  categoryLabel?: string;
};

export function QuickViewModal({
  product,
  open,
  onOpenChange,
  locale,
  categoryLabel,
}: QuickViewModalProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const isAr = locale === "ar";

  if (!product) return null;

  const name = isAr ? product.name_ar : product.name_en;
  const price = Number(product.price);
  const image = product.image ?? "/assets/landing/product-sash.jpg";

  const handleAdd = () => {
    setAdding(true);
    try {
      addItem(buildDefaultCartItemFromProduct(product, locale, quantity));
      dispatchCartPulse();
      toast.success(isAr ? "تمت الإضافة للسلة" : "Added to cart", {
        action: {
          label: isAr ? "عرض السلة" : "View cart",
          onClick: () => router.push("/cart"),
        },
      });
      onOpenChange(false);
      setQuantity(1);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-warka-border bg-card p-0 shadow-tint-lg outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <Dialog.Close
            className="absolute end-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-card/90 text-warka-text shadow-card transition-colors hover:bg-warka-bg"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="size-4" />
          </Dialog.Close>

          <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-media-bg">
            <Image src={image} alt={name} fill className="object-cover" sizes="512px" />
          </div>

          <div className="space-y-4 p-5">
            {categoryLabel && (
              <p className="text-xs font-medium uppercase tracking-wide text-warka-primary">
                {categoryLabel}
              </p>
            )}
            <Dialog.Title className="text-lg font-bold text-warka-text">{name}</Dialog.Title>
            <Dialog.Description className="sr-only">
              {isAr ? "معاينة سريعة للمنتج" : "Product quick view"}
            </Dialog.Description>
            <p className="text-xl font-bold text-warka-primary">{formatIqd(price, locale)}</p>

            <div className="flex items-center justify-between rounded-xl border border-warka-border bg-warka-bg/40 px-3 py-2">
              <span className="text-sm font-medium text-warka-text-secondary">
                {isAr ? "الكمية" : "Quantity"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex size-9 items-center justify-center rounded-lg border border-warka-border bg-card text-warka-text hover:bg-warka-bg"
                  aria-label={isAr ? "تقليل" : "Decrease"}
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-[2rem] text-center font-semibold text-warka-text">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex size-9 items-center justify-center rounded-lg border border-warka-border bg-card text-warka-text hover:bg-warka-bg"
                  aria-label={isAr ? "زيادة" : "Increase"}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={adding}
              onClick={handleAdd}
              className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-warka-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark disabled:opacity-50"
            >
              <ShoppingBag className="size-4" />
              {adding
                ? isAr
                  ? "جاري الإضافة..."
                  : "Adding..."
                : isAr
                  ? "أضف للسلة"
                  : "Add to cart"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
