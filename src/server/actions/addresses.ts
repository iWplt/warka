"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import type { StudentAddress } from "@/types/database";

const addressSchema = z.object({
  label: z.string().min(1),
  address_line: z.string().min(3),
  city: z.string().optional(),
  governorate: z.string().optional(),
  area: z.string().optional(),
  phone: z.string().optional(),
  college: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  location_url: z.string().nullable().optional(),
  is_default: z.boolean().optional(),
});

export async function getMyAddresses(): Promise<StudentAddress[]> {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("student_addresses")
    .select("*")
    .eq("student_id", profile.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as StudentAddress[];
}

export async function createAddress(input: z.infer<typeof addressSchema>) {
  const profile = await requireRole(["student"]);
  const data = addressSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  if (data.is_default) {
    await supabase
      .from("student_addresses")
      .update({ is_default: false })
      .eq("student_id", profile.id);
  }

  const { data: row, error } = await supabase
    .from("student_addresses")
    .insert({
      student_id: profile.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/student/addresses");
  return row as StudentAddress;
}

export async function deleteAddress(addressId: string) {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase
    .from("student_addresses")
    .delete()
    .eq("id", addressId)
    .eq("student_id", profile.id);

  if (error) throw new Error(error.message);
  revalidatePath("/student/addresses");
}

export async function setDefaultAddress(addressId: string) {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  await supabase
    .from("student_addresses")
    .update({ is_default: false })
    .eq("student_id", profile.id);

  const { error } = await supabase
    .from("student_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("student_id", profile.id);

  if (error) throw new Error(error.message);
  revalidatePath("/student/addresses");
}
