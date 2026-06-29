"use client";

import Image from "next/image";
import { Palette } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatIqd } from "@/lib/format/currency";
import { QuickAddToCart } from "@/components/features/cart/quick-add-to-cart";
import type { Product, ProductCategory } from "@/types/database";

type CatalogSection = {
  category: ProductCategory;
  products: Product[];
};

type ProductsPageClientProps = {
  sections: CatalogSection[];
};

export function ProductsPageClient({ sections }: ProductsPageClientProps) {
  const locale = useLocale();

  const hasProducts = sections.some((s) => s.products.length > 0);

  return (
    <div className="bg-warka-bg pb-24 md:pb-16">
      <div className="border-b border-warka-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-warka-text-muted">
            <Link href="/" className="hover:text-warka-text">
              {locale === "ar" ? "الرئيسية" : "Home"}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-warka-text-secondary">
              {locale === "ar" ? "المنتجات" : "Products"}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-warka-text lg:text-3xl">
          {locale === "ar" ? "منتجات التخرج" : "Graduation Products"}
        </h1>
        <p className="mb-10 text-center text-sm text-warka-text-secondary">
          {locale === "ar"
            ? "تصفح حسب القسم — وشاح، قبعة، روب، بدلة، ومخصص"
            : "Browse by section — sash, cap, gown, suit, and custom"}
        </p>

        {!hasProducts ? (
          <div className="rounded-2xl border border-warka-border bg-white px-6 py-16 text-center shadow-card">
            <p className="text-warka-text-secondary">
              {locale === "ar" ? "لا توجد منتجات حالياً" : "No products available yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {sections.map(({ category, products }) => {
              if (products.length === 0) return null;
              const title = locale === "ar" ? category.name_ar : category.name_en;

              return (
                <section key={category.id} id={category.slug}>
                  <h2 className="mb-6 text-xl font-bold text-warka-text">{title}</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((p) => {
                      const name = locale === "ar" ? p.name_ar : p.name_en;
                      const isCustom = p.product_type === "custom";

                      return (
                        <div
                          key={p.id}
                          className="group overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
                        >
                          {isCustom && !p.image ? (
                            <div className="flex aspect-[4/3] items-center justify-center border-b border-warka-border bg-warka-bg">
                              <Palette className="h-10 w-10 text-warka-primary" />
                            </div>
                          ) : (
                            <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F4F0]">
                              <Image
                                src={p.image ?? "/assets/landing/product-sash.jpg"}
                                alt={name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>
                          )}
                          <div className="p-5">
                            <p className="text-xs font-medium uppercase tracking-wide text-warka-primary">
                              {title}
                            </p>
                            <h3 className="mt-1 text-base font-semibold text-warka-text">{name}</h3>
                            <p className="mt-1 text-sm font-bold text-warka-text">
                              {formatIqd(Number(p.price), locale)}
                            </p>
                            <div className="mt-4 space-y-2">
                              <QuickAddToCart
                                product={p}
                                locale={locale === "ar" ? "ar" : "en"}
                              />
                              <Link
                                href={`/products/${p.id}`}
                                className="block w-full rounded-xl bg-warka-primary py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark"
                              >
                                {locale === "ar" ? "تخصيص وشراء" : "Customize"}
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
