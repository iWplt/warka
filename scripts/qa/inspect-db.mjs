/**
 * QA inspection: dump the tables relevant to the production remediation task
 * to a UTF-8 JSON file so Arabic text is not mangled by the terminal.
 * Usage: node scripts/qa/inspect-db.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
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

const fileEnv = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const out = {};

async function dump(table, query) {
  try {
    const q = query ? query(admin.from(table)) : admin.from(table).select("*");
    const { data, error } = await q;
    if (error) {
      out[table] = { error: error.message };
    } else {
      out[table] = data;
    }
  } catch (e) {
    out[table] = { error: String(e) };
  }
}

await dump("products");
await dump("product_bundles");
await dump("product_bundle_items");
await dump("batches");
await dump("batch_students");
await dump("price_catalog");
await dump("message_templates");
await dump("order_items");
await dump("payments");

// counts for relation checks on batches
async function countWhere(table, col, val) {
  try {
    const { count, error } = await admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(col, val);
    return error ? { error: error.message } : count;
  } catch (e) {
    return { error: String(e) };
  }
}
out._batchRelationCounts = {};
if (Array.isArray(out.batches)) {
  for (const b of out.batches) {
    out._batchRelationCounts[b.id] = {
      name: b.name,
      representative_id: b.representative_id,
      orders: await countWhere("orders", "batch_id", b.id),
      batch_students: await countWhere("batch_students", "batch_id", b.id),
      access_codes: await countWhere("access_codes", "batch_id", b.id),
    };
  }
}

const outDir = resolve(root, "reports");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "db-inspection.json");
writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
console.log("Wrote", outPath);
