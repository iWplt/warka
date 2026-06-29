"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth/guards";
import type { SavedDesign } from "@/types/database";

export async function getProducts() {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("product_type");

  return data ?? [];
}

export async function getMyDesigns(): Promise<SavedDesign[]> {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("designs")
    .select("*")
    .eq("student_id", profile.id)
    .order("updated_at", { ascending: false });

  return (data ?? []) as SavedDesign[];
}

export async function getDesignById(designId: string): Promise<SavedDesign | null> {
  const profile = await requireAuth();
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("designs")
    .select("*")
    .eq("id", designId)
    .single();

  if (!data) return null;
  if (profile.role === "student" && data.student_id !== profile.id) return null;
  if (profile.role === "admin") return data as SavedDesign;
  if (profile.role === "student") return data as SavedDesign;

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("design_id", designId)
    .eq("representative_id", profile.id)
    .maybeSingle();

  if (!order) return null;
  return data as SavedDesign;
}
