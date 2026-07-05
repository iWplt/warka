"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { ProductCard } from "@/components/features/products/product-card";
import { useCompareStore, productToCompareItem } from "@/stores/compare-store";
import { Link } from "@/i18n/routing";
import type { Product, ProductCategory } from "@/types/database";

type CatalogSection = {
  category: ProductCategory;
  products: Product[];
};

type ProductsPageClientProps = {
  sections: CatalogSection[];
  isAuthenticated?: boolean;
};

export function ProductsPageClient({ sections, isAuthenticated = false }: ProductsPageClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [mounted, setMounted] = useState(false);
  const addProduct = useCompareStore((s) => s.addProduct);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const hasProduct = useCompareStore((s) => s.hasProduct);
  const isFull = useCompareStore((s) => s.isFull);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasProducts = sections.some((s) => s.products.length > 0);

  return (
    <div className="bg-warka-bg pb-24 md:pb-16">
      <div className="border-b border-warka-border bg-warka-surface">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-warka-text-muted">
            <Link href="/" className="hover:text-warka-text">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-warka-text-secondary">
              {isAr ? "المنتجات" : "Products"}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-warka-text lg:text-3xl">
          {isAr ? "منتجات التخرج" : "Graduation Products"}
        </h1>
        <p className="mb-10 text-center text-sm text-warka-text-secondary">
          {isAr
            ? "تصفح حسب القسم — وشاح، قبعة، روب، بدلة، ومخصص"
            : "Browse by section — sash, cap, gown, suit, and custom"}
        </p>

        {!hasProducts ? (
          <div className="rounded-2xl border border-warka-border bg-card px-6 py-16 text-center shadow-card">
            <p className="text-warka-text-secondary">
              {isAr ? "لا توجد منتجات حالياً" : "No products available yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {sections.map(({ category, products }) => {
              if (products.length === 0) return null;
              const title = isAr ? category.name_ar : category.name_en;

              return (
                <section key={category.id} id={category.slug}>
                  <h2 className="mb-6 text-xl font-bold text-warka-text">{title}</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        locale={isAr ? "ar" : "en"}
                        categoryLabel={title}
                        isAuthenticated={isAuthenticated}
                        compareChecked={mounted ? hasProduct(p.id) : false}
                        compareDisabled={mounted ? isFull() && !hasProduct(p.id) : false}
                        onCompareChange={(checked) => {
                          if (checked) addProduct(productToCompareItem(p));
                          else removeProduct(p.id);
                        }}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
