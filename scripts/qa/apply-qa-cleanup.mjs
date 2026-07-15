/**
 * Apply migration 033_fix_qa_production_data_cleanup against remote Supabase
 * using the service-role REST client (UTF-8 safe). Idempotent + guarded.
 * Usage: node scripts/qa/apply-qa-cleanup.mjs
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
  "a6331c18-85b4-40d8-9f9d-c2f088542cdc", // Ali
  "b9935aa1-4c37-4bf9-a017-fd937f9b7bd6", // دفعة هندسة 2026 — تجريبية
];

async function fixProduct() {
  const { data, error } = await sb
    .from("products")
    .update({
      name_ar: "وشاح التخرج",
      name_en: "Graduation Sash",
      description_ar: "وشاح تخرج فاخر بتصميم أنيق",
      description_en: "Premium graduation sash with an elegant design",
      slug: "graduation-sash",
      updated_at: new Date().toISOString(),
    })
    .eq("id", SASH_ID)
    .eq("product_type", "sash")
    .select("id, name_ar, name_en, slug");
  if (error) throw new Error(`product update: ${error.message}`);
  console.log("✓ product repaired:", JSON.stringify(data?.[0] ?? null));
}

async function deleteDemoBatches() {
  for (const batchId of DEMO_BATCH_IDS) {
    // Guard: never delete a batch with a representative or real orders.
    const { data: batch } = await sb
      .from("batches")
      .select("id, name, representative_id")
      .eq("id", batchId)
      .maybeSingle();
    if (!batch) {
      console.log(`• batch ${batchId} already absent`);
      continue;
    }
    if (batch.representative_id) {
      console.log(`✗ SKIP ${batch.name}: has representative_id, not orphan`);
      continue;
    }
    const { count: orderCount } = await sb
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batchId);
    if ((orderCount ?? 0) > 0) {
      console.log(`✗ SKIP ${batch.name}: has ${orderCount} order(s), not orphan`);
      continue;
    }

    // Delete only demo members (no login account, no order).
    const { error: delStudents } = await sb
      .from("batch_students")
      .delete()
      .eq("batch_id", batchId)
      .is("student_id", null)
      .is("order_id", null);
    if (delStudents) throw new Error(`batch_students delete: ${delStudents.message}`);

    const { count: remaining } = await sb
      .from("batch_students")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batchId);
    if ((remaining ?? 0) > 0) {
      console.log(`✗ SKIP ${batch.name}: ${remaining} non-demo member(s) remain`);
      continue;
    }

    const { error: delBatch } = await sb.from("batches").delete().eq("id", batchId);
    if (delBatch) throw new Error(`batch delete: ${delBatch.message}`);
    console.log(`✓ deleted orphan demo batch: ${batch.name}`);
  }
}

console.log("Applying QA data cleanup (migration 033)...\n");
await fixProduct();
await deleteDemoBatches();

// Post-verification
const { data: prod } = await sb
  .from("products")
  .select("id, name_ar, name_en, slug, description_ar")
  .eq("id", SASH_ID)
  .maybeSingle();
const { data: batches } = await sb.from("batches").select("id, name");
console.log("\n--- Verification ---");
console.log("product:", JSON.stringify(prod));
console.log("remaining batches:", JSON.stringify(batches));
console.log("\n✅ Done.");
