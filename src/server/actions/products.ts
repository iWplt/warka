"use server";

import { cache } from "react";
import { revalidatePath, unstable_cache } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient, isExpiredJwtError } from "@/lib/supabase/public";
import { requireRole } from "@/lib/auth/guards";
import { GRADUATION_PRODUCT_META } from "@/lib/constants/graduation-products";
import { PRODUCT_CATEGORY_META } from "@/lib/constants/product-categories";
import { DEFAULT_STOREFRONT_PRICES } from "@/lib/constants/storefront-prices";
import { LANDING_IMAGES } from "@/lib/constants/landing-images";
import { uploadDataUrl } from "@/lib/supabase/storage";
import { validateProductImageDataUrl } from "@/lib/upload/validate";
import {
  parseColorVariants,
  parseFabricOptions,
  buildColorVariantsFromLegacy,
  toProductDetailDto,
} from "@/lib/products/variants";
import { dedupeCatalogProducts, filterProductsForCategory } from "@/lib/products/dedupe-catalog";
import { parseProduct } from "@/lib/products/parse-product";
import type { Product, ProductCategory, ProductColorVariant, ProductFabricOption, ProductType } from "@/types/database";

const PRODUCT_TYPES = ["sash", "cap", "gown", "suit", "custom"] as const;

function fallbackImage(type: ProductType): string {
  const meta = GRADUATION_PRODUCT_META.find((m) => m.productType === type);
  if (meta) return meta.image;
  if (type === "suit") return LANDING_IMAGES.products.gown;
  return LANDING_IMAGES.products.custom;
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const supabase = createPublicClient();
  if (!supabase) {
    return PRODUCT_CATEGORY_META.map((c, i) => ({
      id: c.slug,
      slug: c.slug,
      product_type: c.productType,
      name_ar: c.nameAr,
      name_en: c.nameEn,
      sort_order: c.sortOrder,
      active: true,
      created_at: new Date().toISOString(),
    }));
  }

  const { data } = await supabase
    .from("product_categories")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  if (!data?.length) {
    return PRODUCT_CATEGORY_META.map((c) => ({
      id: c.slug,
      slug: c.slug,
      product_type: c.productType,
      name_ar: c.nameAr,
      name_en: c.nameEn,
      sort_order: c.sortOrder,
      active: true,
      created_at: new Date().toISOString(),
    }));
  }

  return data as ProductCategory[];
}

export async function getProductsCatalog(): Promise<Product[]> {
  const supabase = createPublicClient();
  if (!supabase) return buildFallbackCatalogProducts();

  const { data, error } = await supabase
    .from("products")
    .select("*, category:product_categories(*)")
    .eq("active", true)
    .order("sort_order")
    .order("created_at");

  if (error) {
    if (!isExpiredJwtError(error.message)) {
      console.error("getProductsCatalog:", error.message);
    }
    return buildFallbackCatalogProducts();
  }

  const rows = (data ?? []).map((row) => parseProduct(row as Record<string, unknown>));
  const catalog = rows.length > 0 ? rows : buildFallbackCatalogProducts();
  return dedupeCatalogProducts(catalog);
}

function buildFallbackCatalogProducts(): Product[] {
  const now = new Date().toISOString();
  return PRODUCT_CATEGORY_META.map((cat) => {
    const meta = GRADUATION_PRODUCT_META.find((m) => m.productType === cat.productType);
    return {
      id: cat.slug,
      product_type: cat.productType,
      category_id: cat.slug,
      slug: cat.slug,
      name_ar: cat.nameAr,
      name_en: cat.nameEn,
      description_ar: null,
      description_en: null,
      price: DEFAULT_STOREFRONT_PRICES[cat.productType],
      image: meta?.image ?? fallbackImage(cat.productType),
      image_path: null,
      gallery: [],
      colors: ["أسود", "بيج", "زيتوني", "كريمي"],
      color_variants: [],
      fabric_options: [],
      features: [],
      sort_order: cat.sortOrder,
      active: true,
      created_at: now,
      updated_at: now,
    };
  });
}

export async function getCatalogGroupedByCategory() {
  return loadCatalogGroupedByCategory();
}

const loadCatalogGroupedByCategory = unstable_cache(
  async () => {
    const [categories, products] = await Promise.all([
      getProductCategories(),
      getProductsCatalog(),
    ]);

    return categories.map((cat) => ({
      category: cat,
      products: filterProductsForCategory(products, cat.id, cat.product_type).map((p) => {
        const dto = toProductDetailDto(p, fallbackImage);
        return {
          ...p,
          image: dto.image,
        };
      }),
    }));
  },
  ["warka-catalog-grouped"],
  { revalidate: 120, tags: ["products"] }
);

export async function getAllProductsAdmin(): Promise<Product[]> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("products")
    .select("*, category:product_categories(*)")
    .order("sort_order")
    .order("created_at");

  return (data ?? []).map((row) => parseProduct(row as Record<string, unknown>));
}

export const getProductById = cache(async (productId: string) => {
  if (!productId) return null;

  const supabase = createPublicClient();
  let product: Product | null = null;

  if (supabase) {
    const isUuid = /^[0-9a-f-]{36}$/i.test(productId);
    const query = supabase
      .from("products")
      .select("*, category:product_categories(*)")
      .eq("active", true);

    const { data } = isUuid
      ? await query.eq("id", productId).maybeSingle()
      : await query.eq("slug", productId).maybeSingle();

    if (data) product = parseProduct(data as Record<string, unknown>);
  }

  if (!product && PRODUCT_TYPES.includes(productId as (typeof PRODUCT_TYPES)[number])) {
    return getProductByType(productId);
  }

  if (!product) return null;

  return toProductDetailDto(product, fallbackImage);
});

export async function getProductByType(productType: string) {
  const type = productType as ProductType;
  if (!PRODUCT_TYPES.includes(type)) return null;

  const supabase = createPublicClient();
  let product: Product | null = null;

  if (supabase) {
    const { data } = await supabase
      .from("products")
      .select("*, category:product_categories(*)")
      .eq("product_type", type)
      .eq("active", true)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (data) product = parseProduct(data as Record<string, unknown>);
  }

  const meta = GRADUATION_PRODUCT_META.find((m) => m.productType === type);
  const stub: Product = {
    id: product?.id ?? type,
    product_type: type,
    category_id: product?.category_id ?? null,
    slug: product?.slug ?? null,
    name_ar: product?.name_ar ?? meta?.translationKey ?? type,
    name_en: product?.name_en ?? type,
    description_ar: product?.description_ar ?? null,
    description_en: product?.description_en ?? null,
    price: Number(product?.price ?? 0),
    image: product?.image ?? meta?.image ?? fallbackImage(type),
    image_path: product?.image_path ?? null,
    gallery: product?.gallery ?? [],
    colors: product?.colors ?? [],
    color_variants: product?.color_variants ?? [],
    fabric_options: product?.fabric_options ?? [],
    features: product?.features ?? [],
    sort_order: product?.sort_order ?? 0,
    active: product?.active ?? true,
    created_at: product?.created_at ?? new Date().toISOString(),
    updated_at: product?.updated_at ?? new Date().toISOString(),
  };

  return toProductDetailDto(stub, fallbackImage);
}

const productInputSchema = z.object({
  category_id: z.string().uuid(),
  product_type: z.enum(PRODUCT_TYPES),
  slug: z.string().min(1).max(80),
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  price: z.coerce.number().min(0),
  active: z.boolean(),
  sort_order: z.coerce.number().int().min(0).default(0),
  colors: z.array(z.string()).optional(),
  color_variants: z.array(z.any()).optional(),
  fabric_options: z.array(z.any()).optional(),
  features: z.array(z.string()).optional(),
});

export async function createProduct(input: z.infer<typeof productInputSchema>) {
  await requireRole(["admin"]);
  const data = productInputSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: row, error } = await supabase
    .from("products")
    .insert({
      category_id: data.category_id,
      product_type: data.product_type,
      slug: data.slug,
      name_ar: data.name_ar,
      name_en: data.name_en,
      description_ar: data.description_ar ?? null,
      description_en: data.description_en ?? null,
      price: data.price,
      active: data.active,
      sort_order: data.sort_order,
      colors: data.colors ?? ["أسود", "بيج", "زيتوني", "كريمي"],
      color_variants: data.color_variants ?? [],
      fabric_options: data.fabric_options ?? [],
      features: data.features ?? [],
      gallery: [],
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return row.id as string;
}

const updateProductSchema = productInputSchema.extend({
  id: z.string().uuid(),
});

export async function updateProduct(input: z.infer<typeof updateProductSchema>) {
  await requireRole(["admin"]);
  const data = updateProductSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase
    .from("products")
    .update({
      category_id: data.category_id,
      product_type: data.product_type,
      slug: data.slug,
      name_ar: data.name_ar,
      name_en: data.name_en,
      description_ar: data.description_ar ?? null,
      description_en: data.description_en ?? null,
      price: data.price,
      active: data.active,
      sort_order: data.sort_order,
      colors: data.colors ?? ["أسود", "بيج", "زيتوني", "كريمي"],
      color_variants: data.color_variants ?? [],
      fabric_options: data.fabric_options ?? [],
      features: data.features ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function deleteProduct(productId: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase
    .from("products")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function uploadProductImage(productId: string, dataUrl: string) {
  await requireRole(["admin"]);
  const validation = validateProductImageDataUrl(dataUrl);
  if (!validation.ok) throw new Error(validation.error);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const path = `catalog/${productId}/${Date.now()}.jpg`;
  const { publicUrl } = await uploadDataUrl(supabase, "product-images", path, dataUrl, {
    upsert: true,
  });

  const { data: existing } = await supabase
    .from("products")
    .select("gallery, image_path")
    .eq("id", productId)
    .single();

  const gallery = Array.isArray(existing?.gallery) ? [...(existing.gallery as string[])] : [];
  if (publicUrl && !gallery.includes(publicUrl)) gallery.unshift(publicUrl);

  const { error } = await supabase
    .from("products")
    .update({
      image: publicUrl,
      image_path: path,
      gallery,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return publicUrl;
}

const variantsSchema = z.object({
  productId: z.string().uuid(),
  color_variants: z.array(
    z.object({
      key: z.string().min(1),
      label_ar: z.string().min(1),
      label_en: z.string().min(1),
      hex: z.string().min(4),
      images: z.array(z.string()),
      fabric_images: z.record(z.string(), z.array(z.string())).optional(),
    })
  ),
  fabric_options: z.array(
    z.object({
      key: z.string().min(1),
      label_ar: z.string().min(1),
      label_en: z.string().min(1),
      price_adjustment: z.coerce.number(),
      description_ar: z.string().optional(),
      description_en: z.string().optional(),
      image: z.string().nullable().optional(),
    })
  ),
});

export async function updateProductVariants(input: z.infer<typeof variantsSchema>) {
  await requireRole(["admin"]);
  const data = variantsSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const colors = data.color_variants.map((v) => v.label_ar);
  const primaryImage = data.color_variants[0]?.images[0] ?? null;
  const gallery = data.color_variants.flatMap((v) => v.images).filter(Boolean);

  const { error } = await supabase
    .from("products")
    .update({
      color_variants: data.color_variants,
      fabric_options: data.fabric_options,
      colors,
      image: primaryImage,
      gallery: [...new Set(gallery)],
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.productId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function uploadProductVariantImage(
  productId: string,
  colorKey: string,
  dataUrl: string,
  fabricKey: string = "standard"
) {
  await requireRole(["admin"]);
  const validation = validateProductImageDataUrl(dataUrl);
  if (!validation.ok) throw new Error(validation.error);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: row } = await supabase
    .from("products")
    .select("color_variants, colors, gallery, image")
    .eq("id", productId)
    .single();

  if (!row) throw new Error("Product not found");

  const path = `catalog/${productId}/${colorKey}/${fabricKey}-${Date.now()}.jpg`;
  const { publicUrl } = await uploadDataUrl(supabase, "product-images", path, dataUrl, {
    upsert: true,
  });

  if (!publicUrl) throw new Error("Upload failed");

  let variants = parseColorVariants(row.color_variants);
  if (variants.length === 0) {
    variants = buildColorVariantsFromLegacy({
      colors: Array.isArray(row.colors) ? (row.colors as string[]) : [],
      image: (row.image as string) ?? null,
      gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : [],
    });
  }

  let variant = variants.find((v) => v.key === colorKey);
  if (!variant) {
    variant = {
      key: colorKey,
      label_ar: colorKey,
      label_en: colorKey,
      hex: "#cccccc",
      images: [],
    };
    variants.push(variant);
  }

  if (fabricKey === "standard") {
    if (!variant.images.includes(publicUrl)) variant.images.unshift(publicUrl);
  } else {
    variant.fabric_images = variant.fabric_images ?? {};
    const list = variant.fabric_images[fabricKey] ?? [];
    if (!list.includes(publicUrl)) list.unshift(publicUrl);
    variant.fabric_images[fabricKey] = list;
  }

  const colors = variants.map((v) => v.label_ar);
  const gallery = [...new Set(variants.flatMap((v) => [...v.images, ...Object.values(v.fabric_images ?? {}).flat()]))];
  const primaryImage = variants[0]?.images[0] ?? row.image;

  const { error } = await supabase
    .from("products")
    .update({
      color_variants: variants,
      colors,
      gallery,
      image: primaryImage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return publicUrl;
}

export async function removeProductVariantImage(
  productId: string,
  colorKey: string,
  imageUrl: string,
  fabricKey: string = "standard"
) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: row } = await supabase
    .from("products")
    .select("color_variants, colors, gallery, image")
    .eq("id", productId)
    .single();

  if (!row) throw new Error("Product not found");

  const variants = parseColorVariants(row.color_variants);
  const variant = variants.find((v) => v.key === colorKey);
  if (!variant) return;

  if (fabricKey === "standard") {
    variant.images = variant.images.filter((url) => url !== imageUrl);
  } else if (variant.fabric_images?.[fabricKey]) {
    variant.fabric_images[fabricKey] = variant.fabric_images[fabricKey].filter(
      (url) => url !== imageUrl
    );
  }

  const gallery = [...new Set(variants.flatMap((v) => [...v.images, ...Object.values(v.fabric_images ?? {}).flat()]))];
  const primaryImage = variants[0]?.images[0] ?? null;

  const { error } = await supabase
    .from("products")
    .update({
      color_variants: variants,
      gallery,
      image: primaryImage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function uploadProductFabricImage(
  productId: string,
  fabricKey: string,
  dataUrl: string
) {
  await requireRole(["admin"]);
  const validation = validateProductImageDataUrl(dataUrl);
  if (!validation.ok) throw new Error(validation.error);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: row } = await supabase
    .from("products")
    .select("fabric_options")
    .eq("id", productId)
    .single();

  if (!row) throw new Error("Product not found");

  const path = `catalog/${productId}/fabric/${fabricKey}-${Date.now()}.jpg`;
  const { publicUrl } = await uploadDataUrl(supabase, "product-images", path, dataUrl, {
    upsert: true,
  });

  if (!publicUrl) throw new Error("Upload failed");

  const fabrics = parseFabricOptions(row.fabric_options);
  const updated = fabrics.map((f) => (f.key === fabricKey ? { ...f, image: publicUrl } : f));

  const { error } = await supabase
    .from("products")
    .update({
      fabric_options: updated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return publicUrl;
}

export async function getKanbanPrintingOrders() {
  await requireRole(["employee", "admin"]);

  const supabase = await createClient();
  if (!supabase) return { pending: [], approved: [], printing: [], ready: [], delivered: [] };

  const { data } = await supabase
    .from("orders")
    .select("*, profiles!orders_student_id_fkey(full_name, phone)")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  const orders = data ?? [];

  const pendingStatuses = ["new", "pending_review", "designing", "awaiting_approval", "needs_modification"];
  const approvedStatuses = ["ready_for_printing"];
  const printingStatuses = ["printing", "printed"];
  const readyStatuses = ["ready_for_delivery"];
  const deliveredStatuses = ["delivered"];

  return {
    pending: orders.filter((o) => pendingStatuses.includes(o.status)),
    approved: orders.filter((o) => approvedStatuses.includes(o.status)),
    printing: orders.filter((o) => printingStatuses.includes(o.status)),
    ready: orders.filter((o) => readyStatuses.includes(o.status)),
    delivered: orders.filter((o) => deliveredStatuses.includes(o.status)),
  };
}
