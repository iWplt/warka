"use server";

import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bulkLeadProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  product_type: z.string().optional(),
  quantity: z.coerce.number().min(1).optional(),
  sizes: z.record(z.string(), z.coerce.number().min(0)).optional(),
});

export const bulkLeadSchema = z.object({
  university: z.string().min(1),
  student_count: z.coerce.number().min(1),
  coordinator_name: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")),
  products: z.array(bulkLeadProductSchema).min(1),
  notes: z.string().optional(),
});

export type BulkLeadInput = z.infer<typeof bulkLeadSchema>;

export type BulkLeadResult = {
  success: true;
  id?: string;
  persisted: "supabase" | "file" | "log";
};

async function appendLeadToFile(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const dir = path.join(process.cwd(), ".data");
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, "bulk-leads.jsonl");
    const line = JSON.stringify({ ...payload, created_at: new Date().toISOString() });
    await fs.appendFile(filePath, `${line}\n`, "utf8");
    return true;
  } catch (error) {
    console.error("[createBulkLead] File fallback failed:", error);
    return false;
  }
}

export async function createBulkLead(input: BulkLeadInput): Promise<BulkLeadResult> {
  const parsed = bulkLeadSchema.parse(input);

  const payload = {
    university: parsed.university,
    student_count: parsed.student_count,
    coordinator_name: parsed.coordinator_name,
    phone: parsed.phone,
    email: parsed.email?.trim() ? parsed.email.trim() : null,
    products: parsed.products,
    notes: parsed.notes?.trim() ? parsed.notes.trim() : null,
  };

  const supabase = await createClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("bulk_leads")
      .insert(payload)
      .select("id")
      .single();

    if (!error && data) {
      return { success: true, id: data.id as string, persisted: "supabase" };
    }

    console.error("[createBulkLead] Supabase insert failed:", error?.message ?? "Unknown error");
  } else {
    console.warn("[createBulkLead] Supabase client unavailable");
  }

  const fileSaved = await appendLeadToFile(payload);
  if (fileSaved) {
    console.log("[createBulkLead] Lead saved to local file fallback:", payload.university);
    return { success: true, persisted: "file" };
  }

  console.log("[createBulkLead] Lead logged (graceful fallback):", JSON.stringify(payload));
  return { success: true, persisted: "log" };
}
