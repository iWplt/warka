"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import { CheckoutWizard } from "@/components/features/checkout/checkout-wizard";
import { CartCheckoutWizard } from "@/components/features/checkout/cart-checkout-wizard";
import type { PriceCatalogItem, ProductType, Profile } from "@/types/database";

type CheckoutShellProps = {
  profile: Profile;
  prices: PriceCatalogItem[];
  initialProduct?: ProductType;
  initialCatalogProductId?: string;
  catalogProducts: Array<{
    id: string;
    product_type: ProductType;
    name_ar: string;
    name_en: string;
    price: number;
    image: string | null;
    category_name_ar?: string;
    category_name_en?: string;
  }>;
};

export function CheckoutShell(props: CheckoutShellProps) {
  const searchParams = useSearchParams();
  const fromCart = searchParams.get("from") === "cart";
  const cartItems = useCartStore((s) => s.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const useCartFlow =
    mounted && (fromCart || (!props.initialCatalogProductId && cartItems.length > 0));

  if (useCartFlow) {
    return <CartCheckoutWizard profile={props.profile} />;
  }

  return <CheckoutWizard {...props} />;
}
