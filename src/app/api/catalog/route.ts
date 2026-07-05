import { NextResponse } from "next/server";
import { getProductsCatalog } from "@/server/actions/products";
import { env } from "@/lib/env";
import { WARKA_BRAND_NAME } from "@/lib/constants/brand";

export const dynamic = "force-dynamic";

function absoluteUrl(base: string, path: string | null | undefined): string {
  if (!path) return `${base}/assets/landing/product-sash.jpg`;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function GET() {
  const products = await getProductsCatalog();
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const data = products.map((product) => ({
    id: product.id,
    title: product.name_en,
    description: (product.description_en ?? product.name_en).slice(0, 5000),
    availability: product.active ? "in stock" : "out of stock",
    condition: "new",
    price: `${product.price} IQD`,
    link: `${baseUrl}/en/products/${product.id}`,
    image_link: absoluteUrl(baseUrl, product.image),
    brand: WARKA_BRAND_NAME,
    google_product_category: "Apparel & Accessories > Clothing",
    product_type: product.product_type,
  }));

  return NextResponse.json(
    { data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
