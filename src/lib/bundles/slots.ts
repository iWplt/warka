import type { Product, ProductBundle, ProductType } from "@/types/database";

/** Default bundle composition slots (one catalog product per type). */
export const BUNDLE_SLOT_TYPES: ProductType[] = ["sash", "cap", "gown", "suit"];

export const BUNDLE_SLOT_LABELS: Record<ProductType, { ar: string; en: string }> = {
  sash: { ar: "الوشاح", en: "Sash" },
  cap: { ar: "القبعة", en: "Cap" },
  gown: { ar: "الروب", en: "Gown" },
  suit: { ar: "البدلة", en: "Suit" },
  custom: { ar: "منتج مخصص", en: "Custom" },
};

export type BundleSlotSelections = Partial<Record<ProductType, string>>;

export function bundleItemsToSlotSelections(
  bundle: ProductBundle,
  catalog: Product[]
): BundleSlotSelections {
  const map: BundleSlotSelections = {};
  for (const item of bundle.items ?? []) {
    const product = item.product ?? catalog.find((p) => p.id === item.product_id);
    if (product) map[product.product_type] = product.id;
  }
  return map;
}

export function slotSelectionsToItems(selections: BundleSlotSelections) {
  return BUNDLE_SLOT_TYPES.filter((type) => selections[type]).map((type, index) => ({
    product_id: selections[type]!,
    quantity: 1,
    sort_order: index,
  }));
}

export function resolveProductsFromSlots(
  selections: BundleSlotSelections,
  catalog: Product[]
): Product[] {
  const products: Product[] = [];
  for (const type of BUNDLE_SLOT_TYPES) {
    const id = selections[type];
    if (!id) continue;
    const product = catalog.find((p) => p.id === id);
    if (product) products.push(product);
  }
  return products;
}

export function productsByType(catalog: Product[]): Map<ProductType, Product[]> {
  const map = new Map<ProductType, Product[]>();
  for (const product of catalog) {
    const list = map.get(product.product_type) ?? [];
    list.push(product);
    map.set(product.product_type, list);
  }
  return map;
}

export function activeSlotTypes(catalog: Product[]): ProductType[] {
  const byType = productsByType(catalog);
  return BUNDLE_SLOT_TYPES.filter((type) => (byType.get(type)?.length ?? 0) > 0);
}
