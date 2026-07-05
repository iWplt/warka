"use client";

import { buildDefaultCartItemFromProduct } from "@/lib/cart/build-item";
import { calculateBundlePricingFromProducts } from "@/lib/bundles/pricing";
import type { AddCartItemInput } from "@/stores/cart-store";
import { useCartStore } from "@/stores/cart-store";
import type { Product, ProductBundle } from "@/types/database";

export type { BundlePricing } from "@/lib/bundles/pricing";
export { calculateBundlePricingFromProducts as calculateBundlePricing };

export function resolveBundleProducts(bundle: ProductBundle, catalog: Product[]): Product[] {
  if (bundle.items?.length) {
    return bundle.items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => item.product ?? catalog.find((p) => p.id === item.product_id))
      .filter((p): p is Product => Boolean(p));
  }
  return [];
}

export function buildBundleCartItems(
  products: Product[],
  bundle: ProductBundle,
  locale: "ar" | "en"
): AddCartItemInput[] {
  if (products.length === 0) return [];

  const pricing = calculateBundlePricingFromProducts(products, bundle.discount_percent);
  const perItemDiscount = products.length > 0 ? pricing.discount / products.length : 0;

  return products.map((product) => {
    const base = buildDefaultCartItemFromProduct(product, locale);
    return {
      ...base,
      image: product.image ?? bundle.image ?? base.image,
      unitPrice: Math.max(0, Math.round(Number(product.price) - perItemDiscount)),
    };
  });
}

export function addBundleProductsToCart(
  products: Product[],
  bundle: ProductBundle,
  locale: "ar" | "en"
): boolean {
  const items = buildBundleCartItems(products, bundle, locale);
  if (items.length === 0) return false;

  const addItem = useCartStore.getState().addItem;
  items.forEach((item) => addItem(item));
  return true;
}

export function addBundleToCart(
  bundle: ProductBundle,
  catalog: Product[],
  locale: "ar" | "en"
): boolean {
  const products = resolveBundleProducts(bundle, catalog);
  return addBundleProductsToCart(products, bundle, locale);
}
