"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { requireRole } from "@/lib/auth/guards";
import { uploadDataUrl } from "@/lib/supabase/storage";
import { validateProductImageDataUrl } from "@/lib/upload/validate";
import { parseProduct } from "@/lib/products/parse-product";
import type { Product, ProductBundle, ProductBundleItem } from "@/types/database";

function parseBundleItem(row: Record<string, unknown>): ProductBundleItem {
  const productRaw = row.product as Record<string, unknown> | null | undefined;
  return {
    id: row.id as string,
    bundle_id: row.bundle_id as string,
    product_id: row.product_id as string,
    quantity: Number(row.quantity ?? 1),
    sort_order: Number(row.sort_order ?? 0),
    product: productRaw ? parseProduct(productRaw) : null,
  };
}

function parseBundle(row: Record<string, unknown>): ProductBundle {
  const itemsRaw = row.items as Record<string, unknown>[] | undefined;
  return {
    id: row.id as string,
    slug: row.slug as string,
    name_ar: row.name_ar as string,
    name_en: row.name_en as string,
    description_ar: (row.description_ar as string) ?? null,
    description_en: (row.description_en as string) ?? null,
    image: (row.image as string) ?? null,
    image_path: (row.image_path as string) ?? null,
    discount_percent: Number(row.discount_percent ?? 0),
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    items: itemsRaw?.map(parseBundleItem),
  };
}

const BUNDLE_ITEM_SELECT = `
  id,
  bundle_id,
  product_id,
  quantity,
  sort_order,
  product:products(*)
`;

const BUNDLE_SELECT = `
  *,
  items:product_bundle_items(${BUNDLE_ITEM_SELECT})
`;

export async function getActiveBundles(): Promise<ProductBundle[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("product_bundles")
    .select(BUNDLE_SELECT)
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");

  return (data ?? []).map((row) => parseBundle(row as Record<string, unknown>));
}

export async function getAllBundles(): Promise<ProductBundle[]> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("product_bundles")
    .select(BUNDLE_SELECT)
    .order("sort_order")
    .order("created_at");

  return (data ?? []).map((row) => parseBundle(row as Record<string, unknown>));
}

const createBundleSchema = z.object({
  slug: z.string().min(1).max(64),
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  discount_percent: z.coerce.number().min(0).max(100).default(0),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function createBundle(input: z.infer<typeof createBundleSchema>) {
  await requireRole(["admin"]);
  const data = createBundleSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: bundle, error } = await supabase
    .from("product_bundles")
    .insert({
      slug: data.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      name_ar: data.name_ar.trim(),
      name_en: data.name_en.trim(),
      description_ar: data.description_ar?.trim() || null,
      description_en: data.description_en?.trim() || null,
      discount_percent: data.discount_percent,
      sort_order: data.sort_order,
      is_active: data.is_active,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/bundles");
  revalidatePath("/");
  return parseBundle(bundle as Record<string, unknown>);
}

const updateBundleSchema = createBundleSchema.partial().extend({
  id: z.string().uuid(),
});

export async function updateBundle(input: z.infer<typeof updateBundleSchema>) {
  await requireRole(["admin"]);
  const { id, ...patch } = updateBundleSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.slug != null) row.slug = patch.slug.trim().toLowerCase().replace(/\s+/g, "-");
  if (patch.name_ar != null) row.name_ar = patch.name_ar.trim();
  if (patch.name_en != null) row.name_en = patch.name_en.trim();
  if (patch.description_ar !== undefined) row.description_ar = patch.description_ar?.trim() || null;
  if (patch.description_en !== undefined) row.description_en = patch.description_en?.trim() || null;
  if (patch.discount_percent != null) row.discount_percent = patch.discount_percent;
  if (patch.sort_order != null) row.sort_order = patch.sort_order;
  if (patch.is_active != null) row.is_active = patch.is_active;

  const { error } = await supabase.from("product_bundles").update(row).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/bundles");
  revalidatePath("/");
  return { success: true };
}

export async function deleteBundle(bundleId: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase.from("product_bundles").delete().eq("id", bundleId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/bundles");
  revalidatePath("/");
  return { success: true };
}

export async function uploadBundleImage(bundleId: string, dataUrl: string) {
  await requireRole(["admin"]);
  validateProductImageDataUrl(dataUrl);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const uploaded = await uploadDataUrl(
    supabase,
    "products",
    `bundles/${bundleId}/${Date.now()}.webp`,
    dataUrl,
    { validation: "product" }
  );

  const { error } = await supabase
    .from("product_bundles")
    .update({
      image: uploaded.publicUrl,
      image_path: uploaded.path,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bundleId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/bundles");
  revalidatePath("/");
  return uploaded.publicUrl;
}

const bundleItemsSchema = z.object({
  bundle_id: z.string().uuid(),
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.coerce.number().int().min(1).default(1),
      sort_order: z.coerce.number().int().default(0),
    })
  ),
});

export async function updateBundleItems(input: z.infer<typeof bundleItemsSchema>) {
  await requireRole(["admin"]);
  const data = bundleItemsSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error: delError } = await supabase
    .from("product_bundle_items")
    .delete()
    .eq("bundle_id", data.bundle_id);

  if (delError) throw new Error(delError.message);

  if (data.items.length > 0) {
    const { error: insError } = await supabase.from("product_bundle_items").insert(
      data.items.map((item, index) => ({
        bundle_id: data.bundle_id,
        product_id: item.product_id,
        quantity: item.quantity,
        sort_order: item.sort_order ?? index,
      }))
    );
    if (insError) throw new Error(insError.message);
  }

  await supabase
    .from("product_bundles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", data.bundle_id);

  revalidatePath("/admin/bundles");
  revalidatePath("/");
  return { success: true };
}

export async function getProductsForBundlePicker(): Promise<Product[]> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("product_type")
    .order("sort_order");

  return (data ?? []).map((row) => parseProduct(row as Record<string, unknown>));
}
