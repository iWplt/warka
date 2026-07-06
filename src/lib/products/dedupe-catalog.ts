import type { Product } from "@/types/database";

/** Sort products for storefront display (admin-controlled order). */
export function sortProductsForDisplay(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.name_ar.localeCompare(b.name_ar, "ar") ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * @deprecated Legacy helper — kept for one-per-type fallbacks only.
 * Prefer `sortProductsForDisplay` for full catalogs.
 */
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

  return sortProductsForDisplay(Array.from(byType.values()));
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
  return sortProductsForDisplay(matched);
}

export function filterFeaturedProducts(products: Product[], limit = 8): Product[] {
  const featured = sortProductsForDisplay(products.filter((p) => p.active && p.is_featured));
  if (featured.length > 0) return featured.slice(0, limit);
  return sortProductsForDisplay(products.filter((p) => p.active)).slice(0, limit);
}

export const CATALOG_PAGE_SIZE = 12;

export function paginateProducts<T>(items: T[], page: number, pageSize = CATALOG_PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}
