import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { routing } from "@/i18n/routing";
import { getProductCategories, getProductsCatalog } from "@/server/actions/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL;
  const staticPaths = [
    "",
    "/products",
    "/cart",
    "/login",
    "/register",
    "/bulk-order",
    "/compare",
    "/offline",
  ];

  let productPaths: string[] = [];
  let categoryPaths: string[] = [];
  try {
    const [products, categories] = await Promise.all([
      getProductsCatalog(),
      getProductCategories(),
    ]);
    productPaths = products.filter((p) => p.active).map((p) => `/products/${p.id}`);
    categoryPaths = categories.map((c) => `/products/category/${c.slug}`);
  } catch {
    productPaths = [];
    categoryPaths = [];
  }

  const allPaths = [...staticPaths, ...categoryPaths, ...productPaths];

  return routing.locales.flatMap((locale) =>
    allPaths.map((path) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path.startsWith("/products/") ? ("weekly" as const) : path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/products" ? 0.9 : path.startsWith("/products/") ? 0.8 : 0.6,
    }))
  );
}
