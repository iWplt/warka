import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/layouts/error-boundary";
import { GraduationLanding, LandingSkeleton } from "@/components/features/landing";
import { getPriceCatalog } from "@/server/actions/payments";
import { getActiveBundles } from "@/server/actions/bundles";
import { getProductsCatalog } from "@/server/actions/products";
import { WARKA_LOGO_PATH } from "@/lib/constants/brand";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = routing.locales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "auth.brand" });

  return {
    title:
      locale === "ar"
        ? "WARKA | وشاح تخرج بغداد - روب تخرج - قبعة تخرج - متجر طباعة التخرج العراق"
        : "WARKA | Graduation Sashes & Gowns — Iraq Printing Store",
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale,
      type: "website",
      images: [{ url: WARKA_LOGO_PATH, width: 800, height: 400, alt: t("imageAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [WARKA_LOGO_PATH],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en" },
    },
  };
}

export default async function HomePage() {
  const [prices, catalogProducts, bundles] = await Promise.all([
    getPriceCatalog(),
    getProductsCatalog(),
    getActiveBundles(),
  ]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LandingSkeleton />}>
        <GraduationLanding prices={prices} catalogProducts={catalogProducts} bundles={bundles} />
      </Suspense>
    </ErrorBoundary>
  );
}
