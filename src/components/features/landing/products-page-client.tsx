"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { ArrowLeft, Package } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ProductCard } from "@/components/features/products/product-card";
import { ProductCatalogGrid } from "@/components/features/products/product-catalog-grid";
import type { Product, ProductCategory } from "@/types/database";

const PREVIEW_COUNT = 4;

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

  const activeSections = useMemo(
    () => sections.filter((s) => s.products.length > 0),
    [sections]
  );

  const totalProducts = activeSections.reduce((sum, s) => sum + s.products.length, 0);

  return (
    <div className="bg-warka-bg pb-24 md:pb-16">
      <div className="border-b border-warka-border bg-warka-surface">
        <div className="page-container py-3 sm:py-4">
          <nav className="text-caption">
            <Link href="/" className="hover:text-warka-text">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-warka-text-secondary">{isAr ? "منتجاتنا" : "Our products"}</span>
          </nav>
        </div>
      </div>

      <div className="page-container py-6 sm:py-8 lg:py-10">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="page-title">
            {isAr ? "منتجاتنا" : "Our products"}
          </h1>
          <p className="page-description mx-auto mt-2">
            {isAr
              ? `${totalProducts} منتج في ${activeSections.length} أقسام — اختر القسم أو تصفّح المعاينة`
              : `${totalProducts} products in ${activeSections.length} sections — pick a section or browse previews`}
          </p>
        </div>

        {activeSections.length === 0 ? (
          <div className="rounded-2xl border border-warka-border bg-card px-6 py-16 text-center shadow-card">
            <p className="text-warka-text-secondary">
              {isAr ? "لا توجد منتجات حالياً" : "No products available yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
              {activeSections.map(({ category, products }) => {
                const title = isAr ? category.name_ar : category.name_en;
                return (
                  <Link
                    key={category.id}
                    href={`/products/category/${category.slug}`}
                    className="group flex min-h-[108px] flex-col justify-between rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card transition-all hover:border-warka-primary/40 hover:shadow-card-hover"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-warka-primary/10 text-warka-primary transition-colors group-hover:bg-warka-primary/15">
                      <Package className="size-5" />
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-bold text-warka-text">{title}</p>
                      <p className="mt-0.5 text-xs text-warka-text-muted">
                        {isAr ? `${products.length} منتج` : `${products.length} items`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="space-y-12">
              {activeSections.map(({ category, products }) => {
                const title = isAr ? category.name_ar : category.name_en;
                const preview = products.slice(0, PREVIEW_COUNT);

                return (
                  <section key={category.id} id={category.slug}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="section-title sm:text-lg">{title}</h2>
                      <Link
                        href={`/products/category/${category.slug}`}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-warka-primary/30 bg-warka-primary/5 px-3 py-1.5 text-xs font-semibold text-warka-primary transition-colors hover:bg-warka-primary/10 sm:text-sm"
                      >
                        {isAr ? `كل ${title} (${products.length})` : `All ${title} (${products.length})`}
                        <ArrowLeft className="size-3.5" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
                      {preview.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          locale={isAr ? "ar" : "en"}
                          categoryLabel={title}
                          isAuthenticated={isAuthenticated}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type ProductCategoryPageClientProps = {
  category: ProductCategory;
  products: Product[];
  initialPage: number;
  isAuthenticated?: boolean;
};

export function ProductCategoryPageClient({
  category,
  products,
  initialPage,
  isAuthenticated = false,
}: ProductCategoryPageClientProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const title = isAr ? category.name_ar : category.name_en;
  const baseHref = `/products/category/${category.slug}`;

  return (
    <div className="bg-warka-bg pb-24 md:pb-16">
      <div className="border-b border-warka-border bg-warka-surface">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-warka-text-muted">
            <Link href="/" className="hover:text-warka-text">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-warka-text">
              {isAr ? "منتجاتنا" : "Our products"}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-warka-text-secondary">{title}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-warka-text lg:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-warka-text-secondary">
              {isAr
                ? `${products.length} منتج — رتّبها من لوحة الأدمن`
                : `${products.length} products — order them from admin`}
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-warka-border bg-card px-4 py-2 text-sm font-medium text-warka-text-secondary hover:bg-warka-bg"
          >
            <ArrowLeft className="size-4" />
            {isAr ? "كل الأقسام" : "All sections"}
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-warka-border bg-card px-6 py-16 text-center text-sm text-warka-text-secondary">
            {isAr ? "لا توجد منتجات في هذا القسم" : "No products in this section"}
          </div>
        ) : (
          <ProductCatalogGrid
            products={products}
            categoryLabel={title}
            initialPage={initialPage}
            baseHref={baseHref}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>
    </div>
  );
}
