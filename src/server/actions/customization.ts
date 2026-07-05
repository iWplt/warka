"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { requireRole } from "@/lib/auth/guards";
import type {
  CustomizationZone,
  EmbroideryColor,
  EmbroiderySizeRule,
  GownAddition,
  ProductCustomizationProfile,
  ProductStyle,
  TextLibraryEntry,
  ZoneColorOption,
  ZoneContentOption,
} from "@/types/customization";
import type { Product } from "@/types/database";

export async function getProductCustomizationProfile(
  productId: string
): Promise<ProductCustomizationProfile | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const [
    { data: styles },
    { data: zones },
    { data: options },
    { data: size_rules },
    { data: zone_colors },
    { data: gown_additions },
    { data: text_library },
    { data: embroidery_colors },
  ] = await Promise.all([
    supabase.from("product_styles").select("*").eq("product_id", productId).eq("is_active", true).order("sort_order"),
    supabase.from("customization_zones").select("*").eq("product_id", productId).eq("is_active", true).order("sort_order"),
    supabase
      .from("zone_content_options")
      .select("*, customization_zones!inner(product_id)")
      .eq("customization_zones.product_id", productId)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("embroidery_size_rules")
      .select("*, customization_zones!inner(product_id)")
      .eq("customization_zones.product_id", productId)
      .order("sort_order"),
    supabase
      .from("zone_color_options")
      .select("*, customization_zones!inner(product_id)")
      .eq("customization_zones.product_id", productId)
      .order("sort_order"),
    supabase.from("gown_additions").select("*").eq("product_id", productId).eq("is_active", true).order("sort_order"),
    supabase.from("text_library").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("embroidery_colors").select("*").eq("is_active", true).order("sort_order"),
  ]);

  if (!zones?.length && !styles?.length) return null;

  const stripJoin = <T>(rows: Record<string, unknown>[]): T[] =>
    rows.map((row) => {
      const { customization_zones: _, ...rest } = row;
      return rest as T;
    });

  return {
    product_id: productId,
    styles: (styles ?? []) as ProductStyle[],
    zones: (zones ?? []) as CustomizationZone[],
    options: stripJoin<ZoneContentOption>(options ?? []),
    size_rules: stripJoin<EmbroiderySizeRule>(size_rules ?? []),
    zone_colors: stripJoin<ZoneColorOption>(zone_colors ?? []),
    gown_additions: (gown_additions ?? []) as GownAddition[],
    text_library: (text_library ?? []) as TextLibraryEntry[],
    embroidery_colors: (embroidery_colors ?? []) as EmbroideryColor[],
  };
}

export async function getAdminCustomizationProducts(): Promise<
  Pick<Product, "id" | "product_type" | "name_ar" | "name_en">[]
> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("products")
    .select("id, product_type, name_ar, name_en")
    .in("product_type", ["sash", "cap", "gown"])
    .eq("active", true)
    .order("product_type")
    .order("sort_order");

  return data ?? [];
}

export async function getAdminCustomizationBundle(productId: string) {
  await requireRole(["admin"]);
  const profile = await getProductCustomizationProfile(productId);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const [stylesAll, zonesAll, textAll, colorsAll, gownAll] = await Promise.all([
    supabase.from("product_styles").select("*").eq("product_id", productId).order("sort_order"),
    supabase.from("customization_zones").select("*").eq("product_id", productId).order("sort_order"),
    supabase.from("text_library").select("*").order("sort_order"),
    supabase.from("embroidery_colors").select("*").order("sort_order"),
    supabase.from("gown_additions").select("*").eq("product_id", productId).order("sort_order"),
  ]);

  return {
    profile,
    styles: stylesAll.data ?? [],
    zones: zonesAll.data ?? [],
    text_library: textAll.data ?? [],
    embroidery_colors: colorsAll.data ?? [],
    gown_additions: gownAll.data ?? [],
    options: profile?.options ?? [],
    size_rules: profile?.size_rules ?? [],
    zone_colors: profile?.zone_colors ?? [],
  };
}

const styleSchema = z.object({
  product_id: z.string().uuid(),
  style_key: z.string().min(1),
  style_name_ar: z.string().min(1),
  style_name_en: z.string().optional(),
  description_ar: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
  is_batch_locked: z.boolean().default(false),
  preview_image_url: z.string().optional().nullable(),
});

export async function upsertProductStyle(input: z.input<typeof styleSchema> & { id?: string }) {
  await requireRole(["admin"]);
  const data = styleSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const row = {
    ...data,
    style_key: data.style_key.trim().toLowerCase().replace(/\s+/g, "_"),
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("product_styles").update(row).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("product_styles").insert(row);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/customization");
  return { success: true };
}

const zoneSchema = z.object({
  product_id: z.string().uuid(),
  style_id: z.string().uuid().nullable().optional(),
  zone_key: z.string().min(1),
  zone_label_ar: z.string().min(1),
  zone_label_en: z.string().optional(),
  content_type: z.string().min(1),
  allows_multiple: z.boolean().default(false),
  max_chars: z.coerce.number().int().nullable().optional(),
  is_required: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function upsertCustomizationZone(input: z.input<typeof zoneSchema> & { id?: string }) {
  await requireRole(["admin"]);
  const data = zoneSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const row = {
    ...data,
    style_id: data.style_id ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("customization_zones").update(row).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("customization_zones").insert(row);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/customization");
  return { success: true };
}

const textLibrarySchema = z.object({
  category: z.string().min(1),
  content_ar: z.string().min(1),
  content_en: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function upsertTextLibraryEntry(input: z.input<typeof textLibrarySchema> & { id?: string }) {
  await requireRole(["admin"]);
  const data = textLibrarySchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  if (input.id) {
    const { error } = await supabase.from("text_library").update(data).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("text_library").insert(data);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/customization");
  return { success: true };
}

const colorSchema = z.object({
  color_name_ar: z.string().min(1),
  color_name_en: z.string().optional(),
  hex_code: z.string().optional(),
  thread_reference_code: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function upsertEmbroideryColor(input: z.input<typeof colorSchema> & { id?: string }) {
  await requireRole(["admin"]);
  const data = colorSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  if (input.id) {
    const { error } = await supabase.from("embroidery_colors").update(data).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("embroidery_colors").insert(data);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/customization");
  return { success: true };
}

export async function deleteCustomizationRow(
  table:
    | "product_styles"
    | "customization_zones"
    | "text_library"
    | "embroidery_colors"
    | "gown_additions"
    | "zone_content_options"
    | "embroidery_size_rules",
  id: string
) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/customization");
  return { success: true };
}

const zoneOptionSchema = z.object({
  zone_id: z.string().uuid(),
  option_key: z.string().optional(),
  option_name_ar: z.string().min(1),
  option_name_en: z.string().optional(),
  option_type: z.string().min(1),
  preview_image_url: z.string().optional(),
  default_text: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function upsertZoneContentOption(
  input: z.input<typeof zoneOptionSchema> & { id?: string }
) {
  await requireRole(["admin"]);
  const data = zoneOptionSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  if (input.id) {
    const { error } = await supabase.from("zone_content_options").update(data).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("zone_content_options").insert(data);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/customization");
  return { success: true };
}

const sizeRuleSchema = z.object({
  zone_id: z.string().uuid(),
  min_chars: z.coerce.number().int().min(0),
  max_chars: z.coerce.number().int().min(0),
  embroidery_size_mm: z.coerce.number().min(0),
  sort_order: z.coerce.number().int().default(0),
});

export async function upsertEmbroiderySizeRule(
  input: z.input<typeof sizeRuleSchema> & { id?: string }
) {
  await requireRole(["admin"]);
  const data = sizeRuleSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  if (input.id) {
    const { error } = await supabase.from("embroidery_size_rules").update(data).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("embroidery_size_rules").insert(data);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/customization");
  return { success: true };
}

const gownAdditionSchema = z.object({
  product_id: z.string().uuid(),
  style_id: z.string().uuid().nullable().optional(),
  addition_key: z.string().min(1),
  addition_name_ar: z.string().min(1),
  addition_name_en: z.string().optional(),
  color_source: z.enum(["selectable", "match_sash_color", "fixed"]).default("match_sash_color"),
  is_optional: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function upsertGownAddition(
  input: z.input<typeof gownAdditionSchema> & { id?: string }
) {
  await requireRole(["admin"]);
  const data = gownAdditionSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const row = { ...data, style_id: data.style_id ?? null };

  if (input.id) {
    const { error } = await supabase.from("gown_additions").update(row).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("gown_additions").insert(row);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/customization");
  return { success: true };
}
