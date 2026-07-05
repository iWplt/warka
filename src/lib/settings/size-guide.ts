import type { ProductType } from "@/types/database";
import type { SizeGuideEntry } from "@/lib/settings/types";
import { sizeCodesForProduct } from "@/lib/settings/size-display";

function entryMatches(
  entry: SizeGuideEntry,
  heightCm: number,
  weightKg: number,
  bmi: number
): boolean {
  if (entry.min_height_cm != null && heightCm < entry.min_height_cm) return false;
  if (entry.max_height_cm != null && heightCm > entry.max_height_cm) return false;
  if (entry.min_weight_kg != null && weightKg < entry.min_weight_kg) return false;
  if (entry.max_weight_kg != null && weightKg > entry.max_weight_kg) return false;
  if (entry.min_bmi != null && bmi < Number(entry.min_bmi)) return false;
  if (entry.max_bmi != null && bmi > Number(entry.max_bmi)) return false;
  return true;
}

export function suggestSizeFromGuide(
  entries: SizeGuideEntry[],
  heightCm: number,
  weightKg: number,
  productType?: ProductType | null
): SizeGuideEntry | null {
  const bmi = weightKg / (heightCm / 100) ** 2;
  const active = entries.filter((e) => e.is_active);

  const scoped = productType
    ? active.filter((e) => e.product_type === productType || e.product_type === null)
    : active;

  const withRanges = scoped.filter(
    (e) =>
      e.min_height_cm != null ||
      e.max_height_cm != null ||
      e.min_weight_kg != null ||
      e.max_weight_kg != null ||
      e.min_bmi != null ||
      e.max_bmi != null
  );

  const matched = withRanges
    .filter((e) => entryMatches(e, heightCm, weightKg, bmi))
    .sort((a, b) => a.sort_order - b.sort_order);

  if (matched.length > 0) return matched[0];

  const fallback = scoped
    .filter((e) => withRanges.every((r) => r.id !== e.id))
    .sort((a, b) => a.sort_order - b.sort_order);

  return fallback[0] ?? null;
}

export function sizeLabelsForProduct(
  entries: SizeGuideEntry[],
  productType: ProductType,
  _locale: "ar" | "en"
): string[] {
  return sizeCodesForProduct(entries, productType);
}

export function productHasSizeGuide(
  entries: SizeGuideEntry[],
  productType: ProductType
): boolean {
  return entries.some(
    (e) => e.is_active && (e.product_type === productType || e.product_type === null)
  );
}
