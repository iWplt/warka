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

const { data: products } = await sb
  .from("products")
  .select("id, name_ar, product_type, active")
  .in("product_type", ["sash", "cap", "gown"]);

for (const p of products ?? []) {
  console.log(`\n=== ${p.product_type.toUpperCase()}: ${p.name_ar} (active=${p.active}) ===`);
  const { data: styles } = await sb
    .from("product_styles")
    .select("style_key, style_name_ar")
    .eq("product_id", p.id)
    .order("sort_order");
  console.log("Styles:", styles?.length ? styles.map((s) => s.style_key).join(", ") : "NONE");

  const { data: zones } = await sb
    .from("customization_zones")
    .select("id, zone_key, zone_label_ar, content_type, allows_multiple")
    .eq("product_id", p.id)
    .order("sort_order");
  for (const z of zones ?? []) {
    const { data: opts } = await sb
      .from("zone_content_options")
      .select("option_key, option_name_ar, option_type")
      .eq("zone_id", z.id);
    console.log(`  Zone ${z.zone_key}: ${z.zone_label_ar} [${z.content_type}]`);
    for (const o of opts ?? []) {
      console.log(`    - ${o.option_key}: ${o.option_name_ar}`);
    }
  }

  const { data: adds } = await sb
    .from("gown_additions")
    .select("addition_key, addition_name_ar")
    .eq("product_id", p.id);
  if (adds?.length) {
    console.log("Gown additions:", adds.map((a) => a.addition_key).join(", "));
  }
}
