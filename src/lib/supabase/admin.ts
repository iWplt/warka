import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseConfig } from "@/lib/env";

export function createAdminClient() {
  const config = getSupabaseConfig();
  const serviceKey = getServiceRoleKey();

  if (!config || !serviceKey) {
    return null;
  }

  return createClient(config.url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
