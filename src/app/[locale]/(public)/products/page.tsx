import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getCatalogGroupedByCategory } from "@/server/actions/products";
import { ProductsPageClient } from "@/components/features/landing/products-page-client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title:
      locale === "ar"
        ? "اشترِ وشاح تخرج بغداد والبصرة والموصل | WARKA"
        : "Buy Graduation Sashes in Baghdad, Basra & Mosul | WARKA",
    description:
      locale === "ar"
        ? "تصفّح أوشحة وروب وقبعات التخرج — أسعار شفافة وتوصيل لجميع المحافظات."
        : "Browse graduation sashes, gowns, and caps — transparent pricing nationwide.",
  };
}

export default async function ProductsPage() {
  const sections = await getCatalogGroupedByCategory();
  return <ProductsPageClient sections={sections} />;
}
