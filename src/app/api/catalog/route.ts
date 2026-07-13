import { NextResponse } from "next/server";
import { getProductsCatalog } from "@/server/actions/products";
import { env } from "@/lib/env";
import { WARKA_BRAND_NAME } from "@/lib/constants/brand";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { resolveCorsOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

function absoluteUrl(base: string, path: string | null | undefined): string {
  if (!path) return `${base}/assets/landing/product-sash.jpg`;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function corsHeaders(request: Request): HeadersInit {
  const origin = resolveCorsOrigin(request.headers.get("origin"));
  const headers: Record<string, string> = {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    Vary: "Origin",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return headers;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = checkRateLimit(rateLimitKey("catalog", ip), 120, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...corsHeaders(request), "Retry-After": String(rl.retryAfterSec) } }
    );
  }

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

  return NextResponse.json({ data }, { headers: corsHeaders(request) });
}
