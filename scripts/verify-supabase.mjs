/**
 * Verify Supabase connection, schema, buckets, and auth.
 * Usage: npm run supabase:verify
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

const fileEnv = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;

const results = [];

function pass(label) {
  results.push({ label, ok: true });
  console.log(`✓ ${label}`);
}

function fail(label, detail) {
  results.push({ label, ok: false, detail });
  console.error(`✗ ${label}${detail ? `: ${detail}` : ""}`);
}

if (!url || !anonKey) {
  fail("Env: NEXT_PUBLIC_SUPABASE_URL + ANON_KEY");
  process.exit(1);
}
pass("Env: public Supabase URL and anon key present");

if (!serviceKey) {
  fail("Env: SUPABASE_SERVICE_ROLE_KEY (server scripts only)");
} else {
  pass("Env: service role key present (server-only)");
}

const anon = createClient(url, anonKey);
const admin = serviceKey
  ? createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const { error: profilesError } = await anon.from("profiles").select("id").limit(1);
if (profilesError) {
  fail("DB: profiles table readable", profilesError.message);
} else {
  pass("DB: profiles table reachable");
}

if (admin) {
  const { data: admins, error: adminErr } = await admin
    .from("profiles")
    .select("id, email")
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(3);

  if (adminErr) {
    fail("DB: admin profiles (service role)", adminErr.message);
  } else if (!admins?.length) {
    fail("DB: no active admin — visit /ar/setup or run npm run supabase:create-admin");
  } else {
    pass(`DB: ${admins.length} active admin(s)`);
  }

  const { data: buckets, error: bucketErr } = await admin.storage.listBuckets();
  if (bucketErr) {
    fail("Storage: list buckets", bucketErr.message);
  } else {
    const names = (buckets ?? []).map((b) => b.id);
    for (const bucket of ["logos", "designs", "exports", "templates", "qr-codes"]) {
      if (names.includes(bucket)) {
        pass(`Storage: bucket "${bucket}"`);
      } else {
        fail(`Storage: bucket "${bucket}" missing`);
      }
    }
  }

  const { count: productCount, error: productErr } = await admin
    .from("products")
    .select("*", { count: "exact", head: true });

  if (productErr) {
    fail("DB: products table", productErr.message);
  } else {
    pass(`DB: products table (${productCount ?? 0} rows)`);
  }
}

const { error: authHealth } = await anon.auth.getSession();
if (authHealth) {
  fail("Auth: anon client session", authHealth.message);
} else {
  pass("Auth: anon client connected");
}

const failed = results.filter((r) => !r.ok);
console.log("");
if (failed.length) {
  console.error(`${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log("All checks passed.");
