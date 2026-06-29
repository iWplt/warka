"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";

const profileSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  college: z.string().optional(),
  department: z.string().optional(),
  stage: z.string().optional(),
  class_name: z.string().optional(),
  graduation_year: z.coerce.number().optional(),
});

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const profile = await requireAuth();
  const data = profileSchema.parse(input);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase
    .from("profiles")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) throw new Error(error.message);

  revalidatePath("/student/profile");
  return { success: true };
}

export async function syncStudentProfileFromOrder(input: z.infer<typeof profileSchema>) {
  const profile = await requireAuth();
  if (profile.role !== "student") return;

  const data = profileSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) return;

  await supabase
    .from("profiles")
    .update({
      full_name: data.full_name ?? profile.full_name,
      phone: data.phone ?? profile.phone,
      college: data.college ?? profile.college,
      department: data.department ?? profile.department,
      stage: data.stage ?? profile.stage,
      class_name: data.class_name ?? profile.class_name,
      graduation_year: data.graduation_year ?? profile.graduation_year,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);
}
