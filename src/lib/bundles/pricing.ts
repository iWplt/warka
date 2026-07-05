import type { Product } from "@/types/database";

export type BundlePricing = {
  originalPrice: number;
  bundlePrice: number;
  discount: number;
  savingsPercent: number;
};

export function calculateBundlePricingFromProducts(
  products: Pick<Product, "price">[],
  discountPercent: number
): BundlePricing {
  const originalPrice = products.reduce((sum, p) => sum + Number(p.price), 0);
  const discount = Math.round(originalPrice * (discountPercent / 100));
  const bundlePrice = originalPrice - discount;

  return {
    originalPrice,
    bundlePrice,
    discount,
    savingsPercent: discountPercent,
  };
}
