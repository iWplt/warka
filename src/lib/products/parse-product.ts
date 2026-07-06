import { parseColorVariants, parseFabricOptions } from "@/lib/products/variants";
import type { Product, ProductCategory, ProductType } from "@/types/database";

export function parseProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    product_type: row.product_type as ProductType,
    category_id: (row.category_id as string) ?? null,
    slug: (row.slug as string) ?? null,
    name_ar: row.name_ar as string,
    name_en: row.name_en as string,
    description_ar: (row.description_ar as string) ?? null,
    description_en: (row.description_en as string) ?? null,
    price: Number(row.price),
    image: (row.image as string) ?? null,
    image_path: (row.image_path as string) ?? null,
    gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : [],
    colors: Array.isArray(row.colors) ? (row.colors as string[]) : [],
    color_variants: parseColorVariants(row.color_variants),
    fabric_options: parseFabricOptions(row.fabric_options),
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
    embroidery_positions: Array.isArray(row.embroidery_positions)
      ? (row.embroidery_positions as Product["embroidery_positions"])
      : [],
    sort_order: Number(row.sort_order ?? 0),
    is_featured: Boolean(row.is_featured ?? false),
    active: Boolean(row.active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    category: row.category as ProductCategory | null | undefined,
  };
}
