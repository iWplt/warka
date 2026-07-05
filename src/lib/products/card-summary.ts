import { resolveFabricOptions } from "@/lib/products/variants";
import type { Product } from "@/types/database";

export function getShortDescription(
  product: Product,
  locale: "ar" | "en",
  maxLength = 90
): string {
  const raw =
    locale === "ar"
      ? product.description_ar ?? product.name_ar
      : product.description_en ?? product.name_en;
  const text = raw.trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function getFabricSummary(product: Product, locale: "ar" | "en"): string {
  const fabrics = resolveFabricOptions(product.fabric_options ?? []);
  if (fabrics.length === 0) return "";
  return fabrics
    .map((f) => (locale === "ar" ? f.label_ar : f.label_en))
    .join(" · ");
}

export function getStartingPrice(product: Product): number {
  const fabrics = resolveFabricOptions(product.fabric_options ?? []);
  const base = Number(product.price);
  const minAdj = fabrics.reduce(
    (min, f) => Math.min(min, f.price_adjustment),
    0
  );
  return base + Math.max(0, minAdj);
}
