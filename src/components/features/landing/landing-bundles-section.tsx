"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { BundleCard } from "@/components/ux/bundle-card";
import { SectionHeading } from "@/components/ui/scroll-reveal";
import {
  addBundleProductsToCart,
  calculateBundlePricing,
  resolveBundleProducts,
} from "@/stores/bundle-store";
import {
  bundleItemsToSlotSelections,
  resolveProductsFromSlots,
  type BundleSlotSelections,
} from "@/lib/bundles/slots";
import { dispatchCartPulse } from "@/lib/cart/cart-pulse";
import { flushAndNavigate } from "@/lib/cart/persist-flush";
import { useCartStore } from "@/stores/cart-store";
import { LANDING_IMAGES } from "@/lib/constants/landing-images";
import type { Product, ProductBundle } from "@/types/database";

type LandingBundlesSectionProps = {
  catalogProducts: Product[];
  bundles: ProductBundle[];
};

/**
 * A bundle is orderable only when its defined composition resolves to real,
 * active, priced catalog products. Empty/broken bundles are shown disabled
 * ("قريباً") so a user can never click through to an empty/invalid cart.
 */
function isBundleOrderable(bundle: ProductBundle, catalog: Product[]): boolean {
  const products = resolveBundleProducts(bundle, catalog);
  if (products.length === 0) return false;
  return products.every((p) => p.active && Number(p.price) > 0);
}

export function LandingBundlesSection({ catalogProducts, bundles }: LandingBundlesSectionProps) {
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";

  const [selectionsByBundle, setSelectionsByBundle] = useState<Record<string, BundleSlotSelections>>(
    () => {
      const initial: Record<string, BundleSlotSelections> = {};
      for (const bundle of bundles) {
        initial[bundle.id] = bundleItemsToSlotSelections(bundle, catalogProducts);
      }
      return initial;
    }
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (bundles.length === 0) return null;

  const orderableBundles = bundles.filter((b) => isBundleOrderable(b, catalogProducts));
  // Nothing orderable → hide the whole section rather than show only "coming soon".
  if (orderableBundles.length === 0) return null;

  const handleBuy = (bundle: ProductBundle) => {
    if (pendingId) return; // guard against double-click

    const selections = selectionsByBundle[bundle.id] ?? {};
    const selected = resolveProductsFromSlots(selections, catalogProducts);
    // Fall back to the bundle's own composition if the user hasn't swapped slots.
    const products = selected.length > 0 ? selected : resolveBundleProducts(bundle, catalogProducts);

    const valid = products.filter((p) => p.active && Number(p.price) > 0);
    if (valid.length === 0) {
      toast.error(
        isAr
          ? "هذه الباقة غير متوفرة للطلب حالياً"
          : "This bundle isn't available to order right now"
      );
      return;
    }

    setPendingId(bundle.id);
    const ok = addBundleProductsToCart(valid, bundle, isAr ? "ar" : "en");
    if (!ok) {
      setPendingId(null);
      toast.error(
        isAr
          ? "تعذّرت إضافة الباقة إلى السلة"
          : "Could not add the bundle to the cart"
      );
      return;
    }

    dispatchCartPulse();
    toast.success(isAr ? "تمت إضافة الباقة إلى السلة" : "Bundle added to cart");

    // Persist (with fallback handoff) and wait for the write before navigating,
    // so WebKit never opens an empty cart after the bundle is added.
    flushAndNavigate(useCartStore.getState().items, () => {
      router.push("/cart");
      setPendingId(null);
    });
  };

  return (
    <section id="bundles" className="scroll-mt-16 bg-warka-bg py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={isAr ? "الباقات المقترحة" : "Suggested bundles"}
          subtitle={
            isAr
              ? "اختر قطع الباقة من منتجاتك — اضغط القبعة أو الروب لتبديل المنتج"
              : "Pick bundle items from your catalog — tap cap or gown to swap products"
          }
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orderableBundles.map((bundle) => {
            const selections =
              selectionsByBundle[bundle.id] ??
              bundleItemsToSlotSelections(bundle, catalogProducts);
            const selected = resolveProductsFromSlots(selections, catalogProducts);
            const products =
              selected.length > 0 ? selected : resolveBundleProducts(bundle, catalogProducts);
            const pricing = calculateBundlePricing(products, bundle.discount_percent);
            const fallbackImage = LANDING_IMAGES.products.sash;

            return (
              <BundleCard
                key={bundle.id}
                locale={isAr ? "ar" : "en"}
                title={isAr ? bundle.name_ar : bundle.name_en}
                catalog={catalogProducts}
                slotSelections={selections}
                onSlotChange={(next) =>
                  setSelectionsByBundle((prev) => ({ ...prev, [bundle.id]: next }))
                }
                items={products.map((p) => ({
                  id: p.id,
                  name: isAr ? p.name_ar : p.name_en,
                  image: p.image ?? bundle.image ?? fallbackImage,
                  productType: p.product_type,
                }))}
                originalPrice={pricing.originalPrice}
                bundlePrice={pricing.bundlePrice}
                pending={pendingId === bundle.id}
                onAddBundle={() => handleBuy(bundle)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
