/**
 * Create demo student + representative accounts for local testing.
 *
 * Usage (PowerShell):
 *   node scripts/create-demo-users.mjs
 *
 * Optional overrides:
 *   $env:DEMO_STUDENT_EMAIL="student@warka.demo"
 *   $env:DEMO_STUDENT_PASSWORD="Student123!"
 *   $env:DEMO_REP_EMAIL="rep@warka.demo"
 *   $env:DEMO_REP_PASSWORD="Rep123!"
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

function formatError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  return [error.message, error.code, error.details, error.hint].filter(Boolean).join(" | ");
}

const fileEnv = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_ACCOUNTS = [
  {
    email: process.env.DEMO_STUDENT_EMAIL ?? "student@warka.demo",
    password: process.env.DEMO_STUDENT_PASSWORD ?? "Student123!",
    fullName: process.env.DEMO_STUDENT_NAME ?? "طالب تجريبي",
    role: "student",
    college: "كلية الهندسة",
    department: "هندسة الحاسوب",
    phone: "07701234567",
  },
  {
    email: process.env.DEMO_REP_EMAIL ?? "rep@warka.demo",
    password: process.env.DEMO_REP_PASSWORD ?? "Rep123!",
    fullName: process.env.DEMO_REP_NAME ?? "ممثل تجريبي",
    role: "representative",
    college: "كلية الهندسة",
    department: "هندسة الحاسوب",
    phone: "07709876543",
  },
];

if (!url || !serviceKey) {
  console.error("Missing Supabase config in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser(account) {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find(
    (u) => u.email?.toLowerCase() === account.email.toLowerCase()
  );

  let userId = existing?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName, role: account.role },
    });
    if (error) throw new Error(formatError(error));
    userId = data.user?.id;
  }

  if (!userId) throw new Error(`Could not create ${account.email}`);

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: account.role,
      full_name: account.fullName,
      phone: account.phone,
      college: account.college,
      department: account.department,
      is_active: true,
    })
    .eq("id", userId);

  if (profileError) throw new Error(formatError(profileError));

  return { email: account.email, password: account.password, role: account.role };
}

console.log("Creating demo accounts...\n");

const created = [];
for (const account of DEMO_ACCOUNTS) {
  try {
    const result = await ensureUser(account);
    created.push(result);
    console.log(`✓ ${result.role}: ${result.email} / ${result.password}`);
  } catch (err) {
    console.error(`✗ ${account.email}:`, err instanceof Error ? err.message : err);
  }
}

console.log("\nLogin: http://localhost:3000/ar/login");
console.log(`Created or updated ${created.length} account(s).`);
