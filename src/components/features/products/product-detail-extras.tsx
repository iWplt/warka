"use client";

import { useRef } from "react";
import { MessageCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { StickyMobileBar } from "@/components/ux/sticky-mobile-bar";
import { DeliveryDetailsForm } from "@/components/features/delivery/delivery-details-form";
import { SizeGuide } from "@/components/ux/size-guide";
import { buildWhatsAppUrl } from "@/lib/constants/iraq-market";
import { dispatchCartPulse } from "@/lib/cart/cart-pulse";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import type { AddCartItemInput } from "@/stores/cart-store";
import type { SizeGuideEntry } from "@/lib/settings/types";

type ProductDetailExtrasProps = {
  productName: string;
  productUrl: string;
  unitPrice: number;
  cartItem: AddCartItemInput;
  addToCartRef: React.RefObject<HTMLDivElement | null>;
  requiresSize?: boolean;
  selectedSize?: string;
  customMeasurements?: string;
  sizeIsComplete?: boolean;
  sizeGuideOpen?: boolean;
  onSizeGuideOpenChange?: (open: boolean) => void;
  sizeGuideEntries?: SizeGuideEntry[];
  productType?: string | null;
  onSelectSize?: (size: string) => void;
};

export function ProductDetailExtras({
  productName,
  productUrl,
  unitPrice,
  cartItem,
  addToCartRef,
  requiresSize = false,
  selectedSize = "",
  customMeasurements = "",
  sizeIsComplete,
  sizeGuideOpen = false,
  onSizeGuideOpenChange,
  sizeGuideEntries = [],
  productType,
  onSelectSize,
}: ProductDetailExtrasProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const addItem = useCartStore((s) => s.addItem);

  const whatsappMessage = isAr
    ? `مرحباً WARKA، أريد طلب: ${productName}\n${productUrl}`
    : `Hi WARKA, I'd like to order: ${productName}\n${productUrl}`;

  const handleStickyAdd = () => {
    const complete = sizeIsComplete ?? Boolean(selectedSize.trim() || customMeasurements.trim());
    if (requiresSize && !complete) {
      toast.error(
        isAr ? "يرجى اختيار المقاس أو إدخال قياساتك" : "Please select a size or enter measurements"
      );
      return;
    }
    addItem(cartItem);
    dispatchCartPulse();
    toast.success(isAr ? "تمت الإضافة إلى السلة" : "Added to cart");
  };

  return (
    <>
      <div className="space-y-4">
        {requiresSize && onSizeGuideOpenChange && (
          <SizeGuide
            open={sizeGuideOpen}
            onOpenChange={onSizeGuideOpenChange}
            locale={isAr ? "ar" : "en"}
            entries={sizeGuideEntries}
            productType={productType}
            onSelectSize={onSelectSize}
          />
        )}
        <DeliveryDetailsForm locale={isAr ? "ar" : "en"} compact showEstimate />
        {buildWhatsAppUrl(whatsappMessage) && (
          <a
            href={buildWhatsAppUrl(whatsappMessage) ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border-2 border-warka-primary px-6 py-3 text-sm font-semibold text-warka-primary transition-all hover:bg-warka-primary hover:text-white sm:w-auto"
          >
            <MessageCircle className="size-4" />
            {isAr ? "اطلب عبر واتساب" : "Order via WhatsApp"}
          </a>
        )}
      </div>

      <StickyMobileBar
        targetRef={addToCartRef}
        price={unitPrice * cartItem.quantity}
        locale={isAr ? "ar" : "en"}
        onAddToCart={handleStickyAdd}
        className="bottom-16 md:bottom-0"
      />
    </>
  );
}

export function useAddToCartAnchor() {
  return useRef<HTMLDivElement>(null);
}
