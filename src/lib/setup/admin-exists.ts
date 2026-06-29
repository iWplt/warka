import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/env";

export async function adminExists(): Promise<boolean | null> {
  if (!getSupabaseConfig()) return null;

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1);

  if (error) return null;
  return (data?.length ?? 0) > 0;
}
