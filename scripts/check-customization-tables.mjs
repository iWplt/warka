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

const tables = [
  "product_styles",
  "customization_zones",
  "zone_content_options",
  "gown_additions",
  "embroidery_size_rules",
  "text_library",
  "embroidery_colors",
];

for (const table of tables) {
  const { error, count } = await sb.from(table).select("*", { count: "exact", head: true });
  console.log(`${table}: ${error ? `MISSING (${error.message})` : `${count} rows`}`);
}

const { data: products } = await sb
  .from("products")
  .select("id, name_ar, product_type")
  .eq("active", true);

console.log("\nActive products:");
for (const p of products ?? []) {
  console.log(`  - ${p.product_type}: ${p.name_ar} (${p.id})`);
}

if (products?.length) {
  const sash = products.find((p) => p.product_type === "sash");
  if (sash) {
    const { data: zones } = await sb
      .from("customization_zones")
      .select("zone_key, zone_label_ar, content_type")
      .eq("product_id", sash.id)
      .order("sort_order");
    console.log(`\nSash zones for ${sash.name_ar}:`);
    for (const z of zones ?? []) {
      console.log(`  - ${z.zone_key}: ${z.zone_label_ar}`);
    }
  }
}
