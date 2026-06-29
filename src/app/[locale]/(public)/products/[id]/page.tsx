import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getProductById } from "@/server/actions/products";
import { ProductDetailView } from "@/components/features/products/product-detail-view";

type ProductDetailPageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const product = await getProductById(id);

  if (!product || !product.active) {
    notFound();
  }

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
      <div className="border-b border-warka-border bg-white">
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
      <ProductDetailView product={product} />
    </div>
  );
}
