/**
 * One-time admin bootstrap. Do NOT commit credentials.
 *
 * Usage (PowerShell):
 *   $env:ADMIN_EMAIL="your@email.com"
 *   $env:ADMIN_PASSWORD="your-password"
 *   $env:ADMIN_NAME="Library Owner"
 *   node scripts/create-admin.mjs
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
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
  const parts = [
    error.message,
    error.code ? `code: ${error.code}` : null,
    error.status ? `status: ${error.status}` : null,
    error.details ? `details: ${error.details}` : null,
    error.hint ? `hint: ${error.hint}` : null,
  ].filter(Boolean);
  if (parts.length) return parts.join(" | ");
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

const fileEnv = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;

const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME ?? "Library Owner";

if (!url || !serviceKey) {
  console.error(
    "Missing Supabase config. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local"
  );
  process.exit(1);
}

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the same PowerShell session:");
  console.error('  $env:ADMIN_EMAIL="admin@yourshop.com"');
  console.error('  $env:ADMIN_PASSWORD="YourPassword123"');
  console.error('  $env:ADMIN_NAME="Admin"');
  console.error("  node scripts/create-admin.mjs");
  process.exit(1);
}

if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: schemaError } = await admin.from("profiles").select("id").limit(1);

if (schemaError) {
  console.error("Database not ready:", formatError(schemaError));
  console.error("");
  console.error("Run these SQL files in Supabase → SQL Editor first:");
  console.error("  1. supabase/migrations/001_initial_schema.sql");
  console.error("  2. supabase/migrations/002_storage_buckets.sql");
  process.exit(1);
}

const { data: existing, error: existingError } = await admin
  .from("profiles")
  .select("id, role")
  .eq("role", "admin")
  .limit(1);

if (existingError) {
  console.error("Could not check existing admins:", formatError(existingError));
  process.exit(1);
}

if (existing?.length) {
  console.log("An admin account already exists. Skipping create.");
  process.exit(0);
}

const { data: authData, error: authError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});

if (authError) {
  const message = formatError(authError);

  if (message.includes("already been registered") || message.includes("already exists")) {
    const { data: list, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      console.error("Could not list users:", formatError(listError));
      process.exit(1);
    }
    const user = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      console.error("User exists but could not be found:", message);
      process.exit(1);
    }
    const { error: updateError } = await admin
      .from("profiles")
      .update({ role: "admin", full_name: fullName, is_active: true })
      .eq("id", user.id);
    if (updateError) {
      console.error("Could not promote user to admin:", formatError(updateError));
      process.exit(1);
    }
    console.log("Existing user promoted to admin:", email);
    process.exit(0);
  }

  console.error("Auth error:", message);
  console.error("");
  console.error("Common fixes:");
  console.error("  - Run the trigger fix SQL in Supabase SQL Editor (see message below)");
  console.error("  - Supabase → Authentication → Providers → enable Email");
  console.error("  - Confirm migrations were run (profiles table exists)");
  console.error("  - Use a valid email and password (6+ characters)");
  console.error("  - Check service_role key in .env.local is correct");
  console.error("");
  console.error("Trigger fix SQL:");
  console.error(`  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
    );
    RETURN NEW;
  END; $$;`);
  process.exit(1);
}

if (!authData?.user?.id) {
  console.error("User was not created. No user id returned.");
  process.exit(1);
}

const userId = authData.user.id;

const { error: profileError } = await admin
  .from("profiles")
  .update({
    role: "admin",
    full_name: fullName,
    is_active: true,
  })
  .eq("id", userId);

if (profileError) {
  console.error("User created but profile update failed:", formatError(profileError));
  console.error("User id:", userId);
  console.error("Run in SQL Editor:");
  console.error(
    `  UPDATE profiles SET role = 'admin', full_name = '${fullName}', is_active = true WHERE id = '${userId}';`
  );
  process.exit(1);
}

console.log("Admin account created successfully.");
console.log("Email:", email);
console.log("Login at: http://localhost:3000/en/login");
