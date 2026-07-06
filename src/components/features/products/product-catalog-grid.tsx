"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/features/products/product-card";
import { CatalogPagination } from "@/components/features/products/catalog-pagination";
import { useCompareStore, productToCompareItem } from "@/stores/compare-store";
import { CATALOG_PAGE_SIZE, paginateProducts } from "@/lib/products/dedupe-catalog";
import type { Product } from "@/types/database";
import { cn } from "@/lib/utils";

type ProductCatalogGridProps = {
  products: Product[];
  categoryLabel?: string;
  initialPage?: number;
  baseHref: string;
  isAuthenticated?: boolean;
  className?: string;
};

export function ProductCatalogGrid({
  products,
  categoryLabel,
  initialPage = 1,
  baseHref,
  isAuthenticated = false,
  className,
}: ProductCatalogGridProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(initialPage);
  const addProduct = useCompareStore((s) => s.addProduct);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const hasProduct = useCompareStore((s) => s.hasProduct);
  const isFull = useCompareStore((s) => s.isFull);

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const haystack = `${p.name_ar} ${p.name_en} ${p.slug ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [products, query]);

  const pagination = useMemo(
    () => paginateProducts(filtered, page, CATALOG_PAGE_SIZE),
    [filtered, page]
  );

  const searching = query.trim().length > 0;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-warka-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isAr ? "ابحث في هذا القسم…" : "Search in this section…"}
          className="w-full rounded-xl border border-warka-border bg-card py-2.5 ps-10 pe-4 text-sm text-warka-text outline-none focus:ring-2 focus:ring-warka-primary/25"
        />
      </div>

      <p className="text-center text-xs text-warka-text-muted sm:text-sm">
        {isAr
          ? `${pagination.total} منتج — ${pagination.pageSize} بكل صفحة`
          : `${pagination.total} products — ${pagination.pageSize} per page`}
      </p>

      {pagination.items.length === 0 ? (
        <div className="rounded-2xl border border-warka-border bg-card px-6 py-12 text-center text-sm text-warka-text-secondary">
          {isAr ? "لا توجد نتائج لهذا البحث" : "No results for this search"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
          {pagination.items.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              locale={isAr ? "ar" : "en"}
              categoryLabel={categoryLabel}
              isAuthenticated={isAuthenticated}
              compareChecked={hasProduct(p.id)}
              compareDisabled={isFull() && !hasProduct(p.id)}
              onCompareChange={(checked) => {
                if (checked) addProduct(productToCompareItem(p));
                else removeProduct(p.id);
              }}
            />
          ))}
        </div>
      )}

      <CatalogPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        baseHref={baseHref}
        locale={isAr ? "ar" : "en"}
        onPageChange={searching ? setPage : undefined}
      />
    </div>
  );
}
