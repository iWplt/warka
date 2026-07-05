import type { Product } from "@/types/database";

/** Prefer the priced row when migration seeds created duplicate category defaults. */
export function dedupeCatalogProducts(products: Product[]): Product[] {
  const byType = new Map<string, Product>();

  for (const product of products) {
    const key = product.product_type;
    const existing = byType.get(key);
    if (!existing) {
      byType.set(key, product);
      continue;
    }

    const productPrice = Number(product.price);
    const existingPrice = Number(existing.price);

    if (productPrice > existingPrice) {
      byType.set(key, product);
      continue;
    }
    if (productPrice === existingPrice && product.sort_order < existing.sort_order) {
      byType.set(key, product);
    }
  }

  return Array.from(byType.values()).sort(
    (a, b) => a.sort_order - b.sort_order || a.name_en.localeCompare(b.name_en)
  );
}

export function filterProductsForCategory(
  products: Product[],
  categoryId: string,
  productType: string
): Product[] {
  const matched = products.filter(
    (p) =>
      p.category_id === categoryId ||
      (p.category_id == null && p.product_type === productType)
  );
  return dedupeCatalogProducts(matched);
}
