import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env";

/** Anonymous Supabase client for public storefront reads (no user session cookies). */
export function createPublicClient() {
  const config = getSupabaseConfig();
  if (!config) return null;

  return createSupabaseClient(config.url, config.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isExpiredJwtError(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes("jwt expired") || lower.includes("invalid jwt");
}
