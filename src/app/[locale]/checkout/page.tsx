import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getPriceCatalog } from "@/server/actions/payments";
import { getProductsCatalog } from "@/server/actions/products";
import { getCurrentProfile } from "@/lib/auth/guards";
import { CheckoutShell } from "@/components/features/checkout/checkout-shell";
import type { ProductType } from "@/types/database";

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string; catalog?: string }>;
};

const VALID_PRODUCTS = new Set<ProductType>(["sash", "cap", "gown", "suit", "custom"]);

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { locale } = await params;
  const { product: productParam, catalog: catalogParam } = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/${locale}/login`);
  }

  if (profile.role !== "student" && profile.role !== "representative") {
    redirect(`/${locale}/unauthorized`);
  }

  const [prices, catalog] = await Promise.all([getPriceCatalog(), getProductsCatalog()]);
  const initialProduct =
    productParam && VALID_PRODUCTS.has(productParam as ProductType)
      ? (productParam as ProductType)
      : undefined;

  const catalogProducts = catalog.map((p) => ({
    id: p.id,
    product_type: p.product_type,
    name_ar: p.name_ar,
    name_en: p.name_en,
    price: Number(p.price),
    image: p.image,
    category_name_ar: p.category?.name_ar,
    category_name_en: p.category?.name_en,
  }));

  return (
    <Suspense fallback={null}>
      <CheckoutShell
        prices={prices}
        profile={profile}
        initialProduct={initialProduct}
        initialCatalogProductId={catalogParam}
        catalogProducts={catalogProducts}
      />
    </Suspense>
  );
}
