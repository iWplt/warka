import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getProductsCatalog } from "@/server/actions/products";
import { getActiveFonts } from "@/server/actions/fonts";
import { getCurrentProfile } from "@/lib/auth/guards";
import { CheckoutShell } from "@/components/features/checkout/checkout-shell";

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ catalog?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { locale } = await params;
  const { catalog: catalogParam } = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    const returnPath = catalogParam
      ? `/${locale}/checkout?catalog=${catalogParam}`
      : `/${locale}/checkout`;
    redirect(`/${locale}/login?redirect=${encodeURIComponent(returnPath)}`);
  }

  if (profile.role !== "student" && profile.role !== "representative") {
    redirect(`/${locale}/unauthorized`);
  }

  const catalog = await getProductsCatalog();
  const fonts = await getActiveFonts();
  const catalogProducts = catalog.map((p) => ({
    id: p.id,
    product_type: p.product_type,
    name_ar: p.name_ar,
    name_en: p.name_en,
    price: Number(p.price),
    image: p.image,
    fabric_options: p.fabric_options ?? [],
    embroidery_positions: p.embroidery_positions ?? [],
  }));

  return (
    <Suspense fallback={null}>
      <CheckoutShell
        profile={profile}
        initialCatalogProductId={catalogParam}
        catalogProducts={catalogProducts}
        fonts={fonts}
      />
    </Suspense>
  );
}
