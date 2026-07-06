import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ProductCategoryPageClient } from "@/components/features/landing/products-page-client";
import { getCategoryCatalogSection } from "@/server/actions/products";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const section = await getCategoryCatalogSection(slug);
  if (!section) return { title: locale === "ar" ? "المنتجات" : "Products" };

  const title = locale === "ar" ? section.category.name_ar : section.category.name_en;
  return {
    title: locale === "ar" ? `${title} | منتجاتنا` : `${title} | Our products`,
    description:
      locale === "ar"
        ? `تصفّح ${title} — ${section.products.length} منتج في متجر ورقة.`
        : `Browse ${title} — ${section.products.length} products at WARKA.`,
  };
}

export default async function ProductCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const section = await getCategoryCatalogSection(slug);
  if (!section) notFound();

  const initialPage = Math.max(1, Number(pageParam) || 1);

  return (
    <ProductCategoryPageClient
      category={section.category}
      products={section.products}
      initialPage={initialPage}
    />
  );
}
