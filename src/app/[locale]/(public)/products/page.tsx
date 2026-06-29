import { getCatalogGroupedByCategory } from "@/server/actions/products";
import { ProductsPageClient } from "@/components/features/landing/products-page-client";

export default async function ProductsPage() {
  const sections = await getCatalogGroupedByCategory();
  return <ProductsPageClient sections={sections} />;
}
