import type { ProductType } from "@/types/database";

export const SIZE_OPTIONS: Record<string, { ar: string; en: string }[]> = {
  gown: [
    { ar: "S", en: "S" },
    { ar: "M", en: "M" },
    { ar: "L", en: "L" },
    { ar: "XL", en: "XL" },
    { ar: "XXL", en: "XXL" },
  ],
  cap: [
    { ar: "صغير", en: "Small" },
    { ar: "وسط", en: "Medium" },
    { ar: "كبير", en: "Large" },
  ],
  suit: [
    { ar: "S", en: "S" },
    { ar: "M", en: "M" },
    { ar: "L", en: "L" },
    { ar: "XL", en: "XL" },
  ],
};

export function productNeedsSize(type: ProductType): boolean {
  return type === "gown" || type === "cap" || type === "suit";
}

export function getSizeOptions(type: ProductType, locale: "ar" | "en") {
  const options = SIZE_OPTIONS[type];
  if (!options) return [];
  return options.map((o) => (locale === "ar" ? o.ar : o.en));
}
