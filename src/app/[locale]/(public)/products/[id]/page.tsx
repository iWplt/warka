import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getProductById } from "@/server/actions/products";
import { getSizeGuideEntries } from "@/server/actions/settings";
import { getActiveFonts } from "@/server/actions/fonts";
import { getProductCustomizationProfile } from "@/server/actions/customization";
import { Suspense } from "react";
import { FontLoader } from "@/components/features/settings/font-loader";
import { ProductDetailView } from "@/components/features/products/product-detail-view";
import { env } from "@/lib/env";

type ProductDetailPageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Product" };

  const name = locale === "ar" ? product.name_ar : product.name_en;
  const description =
    locale === "ar" ? product.description_ar : product.description_en;
  const image = product.image ?? "/assets/landing/product-sash.jpg";
  const price = Number(product.price);

  return {
    title: name,
    description: description ?? name,
    openGraph: {
      title: name,
      description: description ?? name,
      type: "website",
      images: [{ url: image, width: 800, height: 800, alt: name }],
      locale,
    },
    other: {
      "og:type": "product",
      "product:price:amount": String(price),
      "product:price:currency": "IQD",
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id, locale: localeParam } = await params;
  const locale = await getLocale();
  const product = await getProductById(id);

  if (!product || !product.active) {
    notFound();
  }

  const [sizeGuideEntries, fonts, customizationProfile] = await Promise.all([
    getSizeGuideEntries(product.product_type),
    getActiveFonts(),
    getProductCustomizationProfile(product.id),
  ]);

  const categoryLabel =
    locale === "ar"
      ? { sash: "الأوشحة", cap: "القبعات", gown: "الأروبة", suit: "البدلات", custom: "مخصص" }[
          product.product_type
        ]
      : { sash: "Sashes", cap: "Caps", gown: "Gowns", suit: "Suits", custom: "Custom" }[
          product.product_type
        ];

  return (
    <div className="bg-warka-bg pb-24 md:pb-16">
      <div className="border-b border-warka-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-warka-text-muted">
            <Link href="/" className="hover:text-warka-text">
              {locale === "ar" ? "الرئيسية" : "Home"}
            </Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-warka-text">
              {locale === "ar" ? "المنتجات" : "Products"}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-warka-text-secondary">{categoryLabel}</span>
            <span className="mx-2">/</span>
            <span className="text-warka-text">
              {locale === "ar" ? product.name_ar : product.name_en}
            </span>
          </nav>
        </div>
      </div>
      <FontLoader fonts={fonts} />
      <Suspense fallback={null}>
        <ProductDetailView
          product={product}
          productPageUrl={`${env.NEXT_PUBLIC_APP_URL}/${localeParam}/products/${id}`}
          sizeGuideEntries={sizeGuideEntries}
          fonts={fonts}
          customizationProfile={customizationProfile}
        />
      </Suspense>
    </div>
  );
}
