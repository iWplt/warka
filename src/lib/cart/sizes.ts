import type { ProductType } from "@/types/database";
import { sizeCodesForProduct } from "@/lib/settings/size-display";
import { productHasSizeGuide } from "@/lib/settings/size-guide";
import type { SizeGuideEntry } from "@/lib/settings/types";
import type { ProductSizePolicy } from "@/lib/settings/size-policies";
import {
  getSizePolicy,
  isOneSizeProduct,
  sizeSelectionRequired,
} from "@/lib/settings/size-policies";

/** Legacy fallback when DB size guide is empty */
export const SIZE_OPTIONS: Record<string, { ar: string; en: string }[]> = {
  sash: [
    { ar: "Standard", en: "Standard" },
    { ar: "Long", en: "Long" },
  ],
  gown: [
    { ar: "S", en: "S" },
    { ar: "M", en: "M" },
    { ar: "L", en: "L" },
    { ar: "XL", en: "XL" },
    { ar: "XXL", en: "XXL" },
  ],
  cap: [
    { ar: "S", en: "S" },
    { ar: "M", en: "M" },
    { ar: "L", en: "L" },
    { ar: "XL", en: "XL" },
    { ar: "XXL", en: "XXL" },
  ],
  suit: [
    { ar: "S", en: "S" },
    { ar: "M", en: "M" },
    { ar: "L", en: "L" },
    { ar: "XL", en: "XL" },
    { ar: "XXL", en: "XXL" },
  ],
  custom: [{ ar: "Custom", en: "Custom" }],
};

export function productNeedsSize(type: ProductType): boolean {
  return type in SIZE_OPTIONS;
}

export function getSizeOptions(type: ProductType, locale: "ar" | "en") {
  const options = SIZE_OPTIONS[type];
  if (!options) return [];
  return options.map((o) => (locale === "ar" ? o.ar : o.en));
}

export function getSizeOptionsFromGuide(
  entries: SizeGuideEntry[],
  type: ProductType,
  _locale: "ar" | "en"
): string[] {
  const fromDb = sizeCodesForProduct(entries, type);
  if (fromDb.length > 0) return fromDb;
  return getSizeOptions(type, _locale);
}

export function productNeedsSizeFromGuide(
  entries: SizeGuideEntry[],
  type: ProductType
): boolean {
  if (productHasSizeGuide(entries, type)) return true;
  return productNeedsSize(type);
}

export function lineSizeIsComplete(
  policies: Record<ProductType, ProductSizePolicy>,
  productType: ProductType,
  size: string,
  customMeasurements: string
): boolean {
  const policy = getSizePolicy(policies, productType);
  if (isOneSizeProduct(policy)) return true;
  return !sizeSelectionRequired(policy, size, customMeasurements);
}
