/**
 * Promote a user role (admin only via service role — never expose in client).
 *
 * Usage (PowerShell):
 *   $env:TARGET_EMAIL="user@example.com"
 *   $env:TARGET_ROLE="employee"
 *   node scripts/promote-user.mjs
 *
 * Roles: admin | employee | representative | student
 * For employee, grants printing:view and printing:status by default.
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
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;

const targetEmail = process.env.TARGET_EMAIL?.trim();
const targetRole = (process.env.TARGET_ROLE ?? "employee").trim();

const VALID_ROLES = ["admin", "employee", "representative", "student"];

if (!url || !serviceKey) {
  console.error("Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!targetEmail) {
  console.error("Set TARGET_EMAIL and optionally TARGET_ROLE:");
  console.error('  $env:TARGET_EMAIL="user@example.com"');
  console.error('  $env:TARGET_ROLE="employee"');
  console.error("  node scripts/promote-user.mjs");
  process.exit(1);
}

if (!VALID_ROLES.includes(targetRole)) {
  console.error(`Invalid role. Use: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list, error: listError } = await admin.auth.admin.listUsers();
if (listError) {
  console.error("Could not list users:", listError.message);
  process.exit(1);
}

const user = list.users.find(
  (row) => row.email?.toLowerCase() === targetEmail.toLowerCase()
);

if (!user) {
  console.error("User not found:", targetEmail);
  process.exit(1);
}

const { error: profileError } = await admin
  .from("profiles")
  .update({ role: targetRole, is_active: true })
  .eq("id", user.id);

if (profileError) {
  console.error("Profile update failed:", profileError.message);
  process.exit(1);
}

if (targetRole === "employee") {
  const perms = ["printing:view", "printing:status", "orders:view"];
  for (const permission_key of perms) {
    await admin.from("employee_permissions").upsert(
      { employee_id: user.id, permission_key, granted: true },
      { onConflict: "employee_id,permission_key" }
    );
  }
  console.log("Granted employee permissions:", perms.join(", "));
}

console.log(`Promoted ${targetEmail} → ${targetRole}`);
