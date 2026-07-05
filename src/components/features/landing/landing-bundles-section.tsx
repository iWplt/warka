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

} from "@/stores/bundle-store";

import {

  bundleItemsToSlotSelections,

  resolveProductsFromSlots,

  type BundleSlotSelections,

} from "@/lib/bundles/slots";

import { dispatchCartPulse } from "@/lib/cart/cart-pulse";

import { LANDING_IMAGES } from "@/lib/constants/landing-images";

import type { Product, ProductBundle } from "@/types/database";



type LandingBundlesSectionProps = {

  catalogProducts: Product[];

  bundles: ProductBundle[];

};



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



  if (bundles.length === 0) return null;



  const handleBuy = (bundle: ProductBundle) => {

    const selections = selectionsByBundle[bundle.id] ?? {};

    const products = resolveProductsFromSlots(selections, catalogProducts);

    const ok = addBundleProductsToCart(products, bundle, isAr ? "ar" : "en");

    if (!ok) {

      toast.error(

        isAr

          ? "اختر قطع الباقة من منتجاتك أولاً (وشاح، قبعة، روب…)"

          : "Pick bundle items from your catalog first (sash, cap, gown…)"

      );

      return;

    }

    dispatchCartPulse();

    toast.success(isAr ? "تمت إضافة الباقة إلى السلة" : "Bundle added to cart");

    router.push("/cart");

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

          {bundles.map((bundle) => {

            const selections =

              selectionsByBundle[bundle.id] ??

              bundleItemsToSlotSelections(bundle, catalogProducts);

            const products = resolveProductsFromSlots(selections, catalogProducts);

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

                onAddBundle={() => handleBuy(bundle)}

              />

            );

          })}

        </div>

      </div>

    </section>

  );

}


