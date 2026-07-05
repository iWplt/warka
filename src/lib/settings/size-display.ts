import type { SizeGuideEntry } from "@/lib/settings/types";
import type { ProductType } from "@/types/database";

/** Universal size button label — S, M, L, XL, XXL, etc. */
const LEGACY_SIZE_CODE_MAP: Record<string, string> = {
  SMALL: "S",
  MEDIUM: "M",
  MED: "M",
  LARGE: "L",
  EXTRALARGE: "XL",
  "EXTRA LARGE": "XL",
  "EXTRA-LARGE": "XL",
  "DOUBLE EXTRA LARGE": "XXL",
};

export function normalizeSizeCode(code: string): string {
  const trimmed = code.trim();
  const upper = trimmed.toUpperCase();
  return LEGACY_SIZE_CODE_MAP[upper] ?? upper;
}

export function sizeButtonLabel(entry: SizeGuideEntry): string {
  return normalizeSizeCode(entry.size_code);
}

export function sizeCodesForProduct(
  entries: SizeGuideEntry[],
  productType: ProductType
): string[] {
  const seen = new Set<string>();
  return entries
    .filter((e) => e.is_active && (e.product_type === productType || e.product_type === null))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(sizeButtonLabel)
    .filter((code) => {
      if (seen.has(code)) return false;
      seen.add(code);
      return true;
    });
}

/** Map cap head circumference (cm) to a standard size code. */
export function suggestCapSizeFromHeadCm(headCm: number): "S" | "M" | "L" | "XL" | "XXL" {
  if (headCm < 54) return "S";
  if (headCm < 57) return "M";
  if (headCm < 60) return "L";
  if (headCm < 63) return "XL";
  return "XXL";
}

export function findEntryByDisplayCode(
  entries: SizeGuideEntry[],
  code: string,
  productType?: ProductType | null
): SizeGuideEntry | undefined {
  const normalized = normalizeSizeCode(code);
  return entries.find(
    (e) =>
      e.is_active &&
      normalizeSizeCode(e.size_code) === normalized &&
      (!productType || e.product_type === productType || e.product_type === null)
  );
}
