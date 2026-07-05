"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";
import { uploadBuffer } from "@/lib/supabase/storage";
import type { WarkaFont } from "@/lib/settings/types";
import {
  ARABIC_FONT_PRESETS,
  presetsToWarkaFonts,
} from "@/lib/constants/arabic-font-presets";

const FONT_EXTENSIONS = new Set(["woff2", "woff", "ttf", "otf"]);

function parseFontRow(row: Record<string, unknown>): WarkaFont {
  return {
    id: row.id as string,
    name_ar: row.name_ar as string,
    name_en: (row.name_en as string | null) ?? null,
    font_family_css: row.font_family_css as string,
    file_url: row.file_url as string,
    category: (row.category as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

const loadActiveFonts = unstable_cache(
  async (): Promise<WarkaFont[]> => {
    const supabase = await createClient();
    if (!supabase) return presetsToWarkaFonts();

    const { data } = await supabase
      .from("fonts")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    const fonts = (data ?? []).map((row) => parseFontRow(row as Record<string, unknown>));
    return fonts.length > 0 ? fonts : presetsToWarkaFonts();
  },
  ["warka-active-fonts"],
  { revalidate: 3600, tags: ["fonts"] }
);

export async function getActiveFonts(): Promise<WarkaFont[]> {
  return loadActiveFonts();
}

export async function listAllFonts(): Promise<WarkaFont[]> {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) return presetsToWarkaFonts();

  const { data } = await admin.from("fonts").select("*").order("sort_order");
  const fonts = (data ?? []).map((row) => parseFontRow(row as Record<string, unknown>));
  return fonts.length > 0 ? fonts : presetsToWarkaFonts();
}

export async function seedArabicFontPresets(): Promise<{ inserted: number; skipped: number }> {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { data: existing } = await admin.from("fonts").select("font_family_css");
  const existingKeys = new Set((existing ?? []).map((r) => r.font_family_css as string));

  let inserted = 0;
  let skipped = 0;

  const { data: maxRow } = await admin
    .from("fonts")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let sortOrder = maxRow ? Number(maxRow.sort_order) + 1 : 0;

  for (const preset of ARABIC_FONT_PRESETS) {
    if (existingKeys.has(preset.font_family_css)) {
      skipped += 1;
      continue;
    }

    const { error } = await admin.from("fonts").insert({
      name_ar: preset.name_ar,
      name_en: preset.name_en,
      font_family_css: preset.font_family_css,
      file_url: preset.file_url,
      category: preset.category,
      sort_order: sortOrder++,
      is_active: true,
    });

    if (error) throw new Error(error.message);
    inserted += 1;
  }

  revalidatePath("/admin/fonts");
  return { inserted, skipped };
}

const createFontSchema = z.object({
  name_ar: z.string().min(1),
  name_en: z.string().optional(),
  font_family_css: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  category: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function createFontRecord(input: z.infer<typeof createFontSchema>) {
  await requireRole(["admin"]);
  const data = createFontSchema.parse(input);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { data: maxRow } = await admin
    .from("fonts")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = maxRow ? Number(maxRow.sort_order) + 1 : 0;

  const { data: row, error } = await admin
    .from("fonts")
    .insert({
      name_ar: data.name_ar,
      name_en: data.name_en?.trim() || null,
      font_family_css: data.font_family_css,
      file_url: "",
      category: data.category?.trim() || null,
      sort_order: sortOrder,
      is_active: data.is_active ?? true,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/fonts");
  return parseFontRow(row as Record<string, unknown>);
}

export async function uploadFontFile(fontId: string, base64: string, fileName: string) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!FONT_EXTENSIONS.has(ext)) {
    throw new Error("Supported formats: .woff2, .woff, .ttf, .otf");
  }

  const match = base64.match(/^data:([^;]+);base64,(.+)$/);
  const buffer = match
    ? Buffer.from(match[2], "base64")
    : Buffer.from(base64, "base64");

  const contentType =
    ext === "woff2"
      ? "font/woff2"
      : ext === "woff"
        ? "font/woff"
        : ext === "otf"
          ? "font/otf"
          : "font/ttf";

  const path = `${fontId}/${Date.now()}.${ext}`;
  const { publicUrl } = await uploadBuffer(admin, "fonts", path, buffer, contentType, {
    upsert: true,
  });

  if (!publicUrl) throw new Error("Could not get public URL for font file");

  const { error } = await admin
    .from("fonts")
    .update({ file_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", fontId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/fonts");
  return publicUrl;
}

export async function updateFont(
  id: string,
  input: Partial<{
    name_ar: string;
    name_en: string;
    category: string;
    is_active: boolean;
  }>
) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { error } = await admin
    .from("fonts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/fonts");
}

export async function deleteFont(id: string) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { error } = await admin.from("fonts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/fonts");
}

export async function reorderFonts(orderedIds: string[]) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const updates = orderedIds.map((id, index) =>
    admin
      .from("fonts")
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePath("/admin/fonts");
}
