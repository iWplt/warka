"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useOrderWizardStore } from "@/stores/order-wizard-store";
import { buildDefaultCartItemFromProduct } from "@/lib/cart/build-item";
import { clearCartHandoff, readCartHandoff } from "@/lib/cart/persist-flush";
import { parseStepParam } from "@/lib/orders/wizard-step-guard";
import { UnifiedOrderWizard } from "@/components/features/checkout/unified-order-wizard";
import { FontLoader } from "@/components/features/settings/font-loader";
import type { Profile, ProductType, EmbroideryPosition } from "@/types/database";
import type { WarkaFont } from "@/lib/settings/types";

type CheckoutShellProps = {
  profile: Profile;
  initialCatalogProductId?: string;
  catalogProducts: Array<{
    id: string;
    product_type: ProductType;
    name_ar: string;
    name_en: string;
    price: number;
    image: string | null;
    fabric_options?: import("@/types/database").ProductFabricOption[];
    embroidery_positions?: EmbroideryPosition[];
  }>;
  fonts: WarkaFont[];
};

function CheckoutLoading() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-4xl flex-col items-center justify-center gap-3 px-4 py-16">
      <Loader2 className="size-8 animate-spin text-warka-primary" aria-hidden />
      <p className="text-sm text-warka-text-secondary">Loading checkout…</p>
    </div>
  );
}

function isFreshHandoff(): boolean {
  const handoff = readCartHandoff();
  return Boolean(handoff && Date.now() - handoff.at < 8000 && handoff.count > 0);
}

export function CheckoutShell({
  profile,
  initialCatalogProductId,
  catalogProducts,
  fonts,
}: CheckoutShellProps) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCart = searchParams.get("from") === "cart";
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const syncPricesFromCatalog = useCartStore((s) => s.syncPricesFromCatalog);
  const setStep = useOrderWizardStore((s) => s.setStep);
  const [awaitingHandoff, setAwaitingHandoff] = useState(false);
  const hasHydrated = useSyncExternalStore(
    useCartStore.persist.onFinishHydration,
    () => useCartStore.persist.hasHydrated(),
    () => false
  );
  const wizardHydrated = useSyncExternalStore(
    useOrderWizardStore.persist.onFinishHydration,
    () => useOrderWizardStore.persist.hasHydrated(),
    () => false
  );

  useEffect(() => {
    if (!hasHydrated || catalogProducts.length === 0) return;
    syncPricesFromCatalog(catalogProducts);
  }, [hasHydrated, catalogProducts, syncPricesFromCatalog]);

  useEffect(() => {
    if (!hasHydrated || fromCart) return;
    if (cartItems.length > 0) return;
    if (!initialCatalogProductId) return;

    const product = catalogProducts.find((p) => p.id === initialCatalogProductId);
    if (product) {
      addItem(
        buildDefaultCartItemFromProduct(
          {
            id: product.id,
            product_type: product.product_type,
            name_ar: product.name_ar,
            name_en: product.name_en,
            price: product.price,
            image: product.image,
            color_variants: [],
            fabric_options: product.fabric_options ?? [],
            colors: [],
            gallery: [],
            features: [],
            sort_order: 0,
            is_featured: false,
            active: true,
            category_id: null,
            slug: null,
            description_ar: null,
            description_en: null,
            image_path: null,
            created_at: "",
            updated_at: "",
          },
          locale === "ar" ? "ar" : "en"
        )
      );
    }
  }, [
    hasHydrated,
    fromCart,
    cartItems.length,
    initialCatalogProductId,
    catalogProducts,
    addItem,
    locale,
  ]);

  // iOS Buy Now: cart may hydrate empty once before localStorage write is visible — rehydrate + wait
  useEffect(() => {
    if (!hasHydrated || !fromCart) return;
    if (cartItems.length > 0) {
      setAwaitingHandoff(false);
      clearCartHandoff();
      return;
    }
    if (!isFreshHandoff()) {
      setAwaitingHandoff(false);
      return;
    }

    setAwaitingHandoff(true);
    void useCartStore.persist.rehydrate();

    const retry = window.setTimeout(() => {
      void useCartStore.persist.rehydrate();
    }, 150);
    const giveUp = window.setTimeout(() => {
      setAwaitingHandoff(false);
      clearCartHandoff();
    }, 2500);

    return () => {
      window.clearTimeout(retry);
      window.clearTimeout(giveUp);
    };
  }, [hasHydrated, fromCart, cartItems.length]);

  useEffect(() => {
    if (!hasHydrated || !wizardHydrated || awaitingHandoff) return;

    const requestedStep = parseStepParam(searchParams.get("step"));
    if (requestedStep == null || requestedStep <= 1) return;

    if (cartItems.length === 0) {
      setStep(1);
      router.replace("/checkout");
    }
  }, [
    hasHydrated,
    wizardHydrated,
    awaitingHandoff,
    cartItems.length,
    searchParams,
    setStep,
    router,
  ]);

  if (!hasHydrated || !wizardHydrated || awaitingHandoff) {
    return <CheckoutLoading />;
  }

  return (
    <>
      <FontLoader fonts={fonts} />
      <UnifiedOrderWizard profile={profile} fonts={fonts} catalogProducts={catalogProducts} />
    </>
  );
}
