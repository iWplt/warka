"use server";

import { promises as fs } from "fs";
import path from "path";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit-log";
import { assertSameOriginRequest } from "@/lib/security/origin";

const bulkLeadProductSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(200),
  product_type: z.string().max(50).optional(),
  quantity: z.coerce.number().min(1).max(10_000).optional(),
  sizes: z.record(z.string().max(20), z.coerce.number().min(0).max(10_000)).optional(),
});

export const bulkLeadSchema = z.object({
  university: z.string().min(1).max(200),
  student_count: z.coerce.number().min(1).max(50_000),
  coordinator_name: z.string().min(1).max(120),
  phone: z.string().min(7).max(30),
  email: z.string().email().max(200).optional().or(z.literal("")),
  products: z.array(bulkLeadProductSchema).min(1).max(50),
  notes: z.string().max(2000).optional(),
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
  await assertSameOriginRequest();

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const rl = checkRateLimit(rateLimitKey("bulk-lead", ip), 8, 15 * 60 * 1000);
  if (!rl.allowed) {
    logSecurityEvent("auth.rate_limited", { scope: "bulk-lead", ip });
    throw new Error("Too many requests. Please try again later.");
  }

  const parsed = bulkLeadSchema.parse(input);

  const payload = {
    university: parsed.university.trim().slice(0, 200),
    student_count: parsed.student_count,
    coordinator_name: parsed.coordinator_name.trim().slice(0, 120),
    phone: parsed.phone.trim().slice(0, 30),
    email: parsed.email?.trim() ? parsed.email.trim().slice(0, 200) : null,
    products: parsed.products,
    notes: parsed.notes?.trim() ? parsed.notes.trim().slice(0, 2000) : null,
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
    return { success: true, persisted: "file" };
  }

  console.log("[createBulkLead] Lead accepted (log fallback)");
  return { success: true, persisted: "log" };
}
