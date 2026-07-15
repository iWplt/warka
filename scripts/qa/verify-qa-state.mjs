/**
 * READ-ONLY verification of migration 033 state on remote Supabase.
 * Does NOT mutate anything. Usage: node scripts/qa/verify-qa-state.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..", "..");

function loadEnvFile(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SASH_ID = "7cceb3e9-4317-4c65-9934-edfa172bd4da";
const DEMO_BATCH_IDS = [
  "a6331c18-85b4-40d8-9f9d-c2f088542cdc",
  "b9935aa1-4c37-4bf9-a017-fd937f9b7bd6",
];

const { data: prod } = await sb
  .from("products")
  .select("id, name_ar, name_en, slug, description_ar")
  .eq("id", SASH_ID)
  .maybeSingle();

const { data: demoBatches } = await sb
  .from("batches")
  .select("id, name, representative_id")
  .in("id", DEMO_BATCH_IDS);

const { data: allBatches } = await sb.from("batches").select("id, name");

const hasQuestionMarks = (s) => typeof s === "string" && /\?\?\?/.test(s);

console.log("=== Migration 033 state (read-only) ===\n");
console.log("Arabic sash product:");
console.log(JSON.stringify(prod, null, 2));
const productOk =
  prod &&
  prod.slug === "graduation-sash" &&
  prod.name_ar === "وشاح التخرج" &&
  !hasQuestionMarks(prod.name_ar) &&
  !hasQuestionMarks(prod.description_ar);
console.log(`product repaired: ${productOk ? "YES ✅" : "NO ❌"}`);

console.log("\nDemo batches still present:");
console.log(JSON.stringify(demoBatches ?? [], null, 2));
const batchesGone = (demoBatches ?? []).length === 0;
console.log(`orphan demo batches removed: ${batchesGone ? "YES ✅" : "NO ❌"}`);

console.log("\nAll batches remaining:");
console.log(JSON.stringify(allBatches ?? [], null, 2));

console.log("\n=== SUMMARY ===");
console.log(`migration 033 applied on production: ${productOk && batchesGone ? "YES ✅" : "NO / PARTIAL ❌"}`);
