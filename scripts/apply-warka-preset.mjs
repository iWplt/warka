/**
 * Apply WARKA customization preset (migration 030 logic) via Supabase REST API.
 * Usage: node scripts/apply-warka-preset.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function upsertStyle(productId, row) {
  const { error } = await sb.from("product_styles").upsert(
    { product_id: productId, ...row, is_active: true },
    { onConflict: "product_id,style_key" }
  );
  if (error) throw new Error(`style ${row.style_key}: ${error.message}`);
}

async function ensureZone(productId, row) {
  const { data: existing } = await sb
    .from("customization_zones")
    .select("id")
    .eq("product_id", productId)
    .eq("zone_key", row.zone_key)
    .is("style_id", null)
    .maybeSingle();

  if (existing) {
    const { error } = await sb.from("customization_zones").update(row).eq("id", existing.id);
    if (error) throw new Error(`zone update ${row.zone_key}: ${error.message}`);
    return existing.id;
  }

  const { data, error } = await sb
    .from("customization_zones")
    .insert({ product_id: productId, style_id: null, is_active: true, ...row })
    .select("id")
    .single();
  if (error) throw new Error(`zone insert ${row.zone_key}: ${error.message}`);
  return data.id;
}

async function ensureOption(zoneId, row) {
  const { data: existing } = await sb
    .from("zone_content_options")
    .select("id")
    .eq("zone_id", zoneId)
    .eq("option_key", row.option_key)
    .maybeSingle();

  if (existing) {
    const { error } = await sb.from("zone_content_options").update(row).eq("id", existing.id);
    if (error) throw new Error(`option update ${row.option_key}: ${error.message}`);
    return;
  }

  const { error } = await sb
    .from("zone_content_options")
    .insert({ zone_id: zoneId, is_active: true, ...row });
  if (error) throw new Error(`option insert ${row.option_key}: ${error.message}`);
}

async function ensureGownAddition(productId, row) {
  const { error } = await sb.from("gown_additions").upsert(
    { product_id: productId, is_active: true, ...row },
    { onConflict: "product_id,addition_key" }
  );
  if (error) throw new Error(`gown addition ${row.addition_key}: ${error.message}`);
}

async function ensureZoneColor(zoneId) {
  const { data } = await sb
    .from("zone_color_options")
    .select("id")
    .eq("zone_id", zoneId)
    .eq("color_source", "match_sash_color")
    .maybeSingle();
  if (data) return;
  const { error } = await sb
    .from("zone_color_options")
    .insert({ zone_id: zoneId, color_source: "match_sash_color", sort_order: 0 });
  if (error) throw new Error(`zone color: ${error.message}`);
}

async function ensureSizeRules(zoneId) {
  const { count } = await sb
    .from("embroidery_size_rules")
    .select("*", { count: "exact", head: true })
    .eq("zone_id", zoneId);
  if (count && count > 0) return;

  const rules = [
    { min_chars: 1, max_chars: 15, embroidery_size_mm: 25, sort_order: 1 },
    { min_chars: 16, max_chars: 40, embroidery_size_mm: 40, sort_order: 2 },
    { min_chars: 41, max_chars: 80, embroidery_size_mm: 55, sort_order: 3 },
    { min_chars: 81, max_chars: 200, embroidery_size_mm: 75, sort_order: 4 },
  ];
  const { error } = await sb
    .from("embroidery_size_rules")
    .insert(rules.map((r) => ({ zone_id: zoneId, ...r })));
  if (error) throw new Error(`size rules: ${error.message}`);
}

async function seedSash(productId) {
  console.log("  → Sash styles + zones");
  for (const s of [
    {
      style_key: "american_original",
      style_name_ar: "الأورجنال الأمريكي — مثلث أمام وخلف",
      style_name_en: "American Original — triangle both sides",
      sort_order: 1,
    },
    {
      style_key: "triangle_both",
      style_name_ar: "مثلث من الأمام والخلف",
      style_name_en: "Triangle front and back",
      sort_order: 2,
    },
    {
      style_key: "triangle_curved",
      style_name_ar: "مثلث أمام + دائري/مقوس خلف",
      style_name_en: "Triangle front + curved back",
      sort_order: 3,
    },
    {
      style_key: "custom_image",
      style_name_ar: "طلب خاص حسب صورة",
      style_name_en: "Custom from reference photo",
      sort_order: 4,
    },
  ]) {
    await upsertStyle(productId, s);
  }

  const leftId = await ensureZone(productId, {
    zone_key: "left_front",
    zone_label_ar: "اليسار — الاختصاص + الاسم (ثنائي/ثلاثي)",
    zone_label_en: "Left — major + name",
    content_type: "name_major",
    max_chars: 45,
    is_required: true,
    sort_order: 1,
    allows_multiple: false,
  });

  const rightId = await ensureZone(productId, {
    zone_key: "right_front",
    zone_label_ar: "اليمين — سنة بالطول أو معلومات الجامعة",
    zone_label_en: "Right — year or university info",
    content_type: "university_info",
    max_chars: 90,
    is_required: false,
    sort_order: 2,
    allows_multiple: false,
  });

  const backId = await ensureZone(productId, {
    zone_key: "back",
    zone_label_ar: "الخلف — آية/اقتباس (القياس حسب طول النص)",
    zone_label_en: "Back — verse/quote (auto size)",
    content_type: "text_library",
    max_chars: 150,
    is_required: false,
    sort_order: 3,
    allows_multiple: false,
  });

  await ensureOption(rightId, {
    option_key: "mode_year",
    option_name_ar: "سنة بالطول",
    option_name_en: "Vertical graduation year",
    option_type: "custom_text",
    sort_order: 1,
  });
  await ensureOption(rightId, {
    option_key: "mode_university",
    option_name_ar: "قسم/جامعة + لوغو + Class of + سنة",
    option_name_en: "Dept/university + logo + Class of + year",
    option_type: "logo_upload",
    sort_order: 2,
  });

  for (const zid of [leftId, rightId, backId]) {
    await ensureZoneColor(zid);
    await ensureSizeRules(zid);
  }
}

async function seedCap(productId) {
  console.log("  → Cap zones + options");
  const sideId = await ensureZone(productId, {
    zone_key: "side_band",
    zone_label_ar: "الطوق الجانبي — الاسم + نقشة بسيطة",
    zone_label_en: "Side band — name + small pattern",
    content_type: "name_major",
    allows_multiple: true,
    max_chars: 35,
    is_required: false,
    sort_order: 1,
  });

  const topId = await ensureZone(productId, {
    zone_key: "top",
    zone_label_ar: "الأعلى — آية/اقتباس/لوغو/نقشة",
    zone_label_en: "Top — verse/quote/logo/pattern",
    content_type: "text_library",
    allows_multiple: false,
    max_chars: 80,
    is_required: false,
    sort_order: 2,
  });

  for (const o of [
    {
      option_key: "butterfly",
      option_name_ar: "نقشة فراشة (مثال: نور + فراشة)",
      option_name_en: "Butterfly motif (e.g. Noor + butterfly)",
      option_type: "preset_pattern",
      sort_order: 1,
    },
    {
      option_key: "star",
      option_name_ar: "نجمة بسيطة",
      option_name_en: "Simple star",
      option_type: "preset_pattern",
      sort_order: 2,
    },
    {
      option_key: "floral",
      option_name_ar: "زخرفة زهرية",
      option_name_en: "Floral motif",
      option_type: "preset_pattern",
      sort_order: 3,
    },
  ]) {
    await ensureOption(sideId, o);
  }

  for (const o of [
    {
      option_key: "library_text",
      option_name_ar: "نص من المكتبة (آية/اقتباس)",
      option_name_en: "Library text (verse/quote)",
      option_type: "preset_text",
      sort_order: 1,
    },
    {
      option_key: "upload_logo",
      option_name_ar: "رفع شعار",
      option_name_en: "Upload logo",
      option_type: "logo_upload",
      sort_order: 2,
    },
    {
      option_key: "preset_pattern",
      option_name_ar: "نقشة جاهزة",
      option_name_en: "Preset pattern",
      option_type: "preset_pattern",
      sort_order: 3,
    },
  ]) {
    await ensureOption(topId, o);
  }

  for (const zid of [sideId, topId]) {
    await ensureZoneColor(zid);
    await ensureSizeRules(zid);
  }
}

async function seedGown(productId) {
  console.log("  → Gown styles + additions (no chest zones per WARKA spec)");
  for (const s of [
    {
      style_key: "plain",
      style_name_ar: "عادي — بدون كسرات",
      style_name_en: "Plain — no pleats",
      sort_order: 1,
      is_batch_locked: false,
    },
    {
      style_key: "gulf",
      style_name_ar: "خليجي — كسرات كتف + ردن كلوش",
      style_name_en: "Gulf — shoulder pleats + cloche collar",
      sort_order: 2,
      is_batch_locked: false,
    },
    {
      style_key: "american",
      style_name_ar: "أمريكي — كسرات صدر وظهر",
      style_name_en: "American — chest & back pleats",
      sort_order: 3,
      is_batch_locked: false,
    },
    {
      style_key: "batch_custom",
      style_name_ar: "خاص بالدفعة ☝",
      style_name_en: "Batch-only style",
      sort_order: 4,
      is_batch_locked: true,
    },
  ]) {
    await upsertStyle(productId, s);
  }

  // Deactivate legacy gown embroidery zones (not in Hassan spec)
  const { error: deactivateErr } = await sb
    .from("customization_zones")
    .update({ is_active: false })
    .eq("product_id", productId)
    .in("zone_key", ["chest_left", "chest_right", "sleeve"]);
  if (deactivateErr) throw new Error(`deactivate gown zones: ${deactivateErr.message}`);

  for (const a of [
    {
      addition_key: "yoke_heart",
      addition_name_ar: "فتحة/قلبة بالردن + تطعيم",
      addition_name_en: "Collar heart opening + trim",
      color_source: "match_sash_color",
      sort_order: 1,
    },
    {
      addition_key: "cuff_trim",
      addition_name_ar: "تطعيم بزمة",
      addition_name_en: "Button placket trim",
      color_source: "match_sash_color",
      sort_order: 2,
    },
    {
      addition_key: "satin_trim",
      addition_name_ar: "تطعيم ستان (لون قابل للتغيير)",
      addition_name_en: "Satin trim (selectable color)",
      color_source: "selectable",
      sort_order: 3,
    },
    {
      addition_key: "extra_embroidery",
      addition_name_ar: "تطريز/خط إضافي",
      addition_name_en: "Extra embroidery line",
      color_source: "match_sash_color",
      sort_order: 4,
    },
    {
      addition_key: "small_icon",
      addition_name_ar: "نقشة/رسمة صغيرة/حرف",
      addition_name_en: "Small icon/letter art",
      color_source: "selectable",
      sort_order: 5,
    },
    {
      addition_key: "shape_frame",
      addition_name_ar: "إطار حسب الشكل المطلوب",
      addition_name_en: "Frame per selected style",
      color_source: "selectable",
      sort_order: 6,
    },
  ]) {
    await ensureGownAddition(productId, a);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log("Applying WARKA customization preset...\n");

// Activate sash product
const { data: sashInactive } = await sb
  .from("products")
  .select("id, name_ar")
  .eq("product_type", "sash")
  .eq("active", false);

for (const p of sashInactive ?? []) {
  const { error } = await sb.from("products").update({ active: true }).eq("id", p.id);
  if (error) throw new Error(`activate sash: ${error.message}`);
  console.log(`✓ Activated sash: ${p.name_ar}`);
}

const { data: products, error: prodErr } = await sb
  .from("products")
  .select("id, name_ar, product_type")
  .eq("active", true)
  .in("product_type", ["sash", "cap", "gown"]);

if (prodErr) throw new Error(prodErr.message);

for (const p of products ?? []) {
  console.log(`\n${p.product_type.toUpperCase()}: ${p.name_ar}`);
  if (p.product_type === "sash") await seedSash(p.id);
  else if (p.product_type === "cap") await seedCap(p.id);
  else if (p.product_type === "gown") await seedGown(p.id);
}

console.log("\n✅ WARKA preset applied successfully.");
console.log("Run: node scripts/check-customization-detail.mjs");
