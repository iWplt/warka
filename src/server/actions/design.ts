"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { uploadDataUrl } from "@/lib/supabase/storage";
import { isLocalAuthEnabled } from "@/lib/auth/local-session";
import { PermissionError, requireAuth, requireRole, requirePermission } from "@/lib/auth/guards";
import {
  createNotificationInternal as createNotification,
  logActivityInternal as logActivity,
  notifyAdminsAndEmployees,
} from "@/lib/notifications/internal";
import { getDemoTemplates } from "@/lib/design/demo-templates";
import type { DesignSubmissionStatus, DesignTemplate, ProductType, TemplateConfig } from "@/types/database";

const templateSchema = z.object({
  product_type: z.enum(["sash", "cap", "gown", "suit", "custom"]),
  name: z.string().min(1),
  preview_url: z.string().optional(),
  template_url: z.string().optional(),
  template_config: z.record(z.unknown()),
});

function mapTemplateRow(row: Record<string, unknown>): DesignTemplate {
  return {
    ...row,
    template_config: row.template_config as DesignTemplate["template_config"],
  } as DesignTemplate;
}

/**
 * Active templates for the public website (no login required).
 * Falls back to built-in demo templates when the database is empty.
 */
export async function getPublicTemplates(): Promise<DesignTemplate[]> {
  const supabase = await createClient();
  if (!supabase) return getDemoTemplates();

  const { data } = await supabase
    .from("design_templates")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (!data?.length) return getDemoTemplates();
  return data.map((row) => mapTemplateRow(row as Record<string, unknown>));
}

export async function getTemplates(productType?: ProductType) {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase.from("design_templates").select("*").eq("active", true);
  if (productType) query = query.eq("product_type", productType);

  const { data } = await query;
  return (data ?? []).map((row) => mapTemplateRow(row as Record<string, unknown>));
}

export async function deactivateTemplate(templateId: string) {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase
    .from("design_templates")
    .update({ active: false })
    .eq("id", templateId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/templates");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTemplate(templateId: string) {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase
    .from("design_templates")
    .delete()
    .eq("id", templateId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/templates");
  revalidatePath("/");
  return { success: true };
}

export async function createTemplate(input: z.infer<typeof templateSchema>) {
  await requireRole(["admin"]);
  const data = templateSchema.parse(input);

  const supabase = await createClient();
  if (!supabase) {
    throw new Error(
      isLocalAuthEnabled()
        ? "Saving templates requires Supabase. Connect a database to store templates."
        : "Supabase not configured"
    );
  }

  const { data: template, error } = await supabase
    .from("design_templates")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/templates");
  return template;
}

export async function updateDesignSubmission(
  submissionId: string,
  updates: {
    status?: DesignSubmissionStatus;
    modification_notes?: string;
    preview_url?: string;
    customizations?: Record<string, string>;
  }
) {
  const profile = await requireAuth();
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: submission } = await supabase
    .from("design_submissions")
    .select("*, orders(student_id, representative_id, order_number)")
    .eq("id", submissionId)
    .single();

  if (!submission) throw new Error("Submission not found");

  const order = submission.orders as {
    student_id: string | null;
    representative_id: string | null;
    order_number: string;
    status?: string;
  };

  if (profile.role === "student") {
    if (order.student_id !== profile.id) {
      throw new PermissionError("You can only manage your own design");
    }
    const allowedStatuses = ["approved", "needs_modification"] as const;
    if (updates.status && !allowedStatuses.includes(updates.status as typeof allowedStatuses[number])) {
      throw new PermissionError("Invalid design action");
    }
  } else if (profile.role === "employee") {
    await requirePermission("design:view");
  } else if (profile.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const updatePayload: Record<string, unknown> = { ...updates };
  if (updates.status === "approved") {
    updatePayload.approved_by = profile.id;
    updatePayload.approved_at = new Date().toISOString();
  }

  await supabase
    .from("design_submissions")
    .update(updatePayload)
    .eq("id", submissionId);

  if (updates.status === "needs_modification") {
    await notifyAdminsAndEmployees(
      "modification_requested",
      `Modification requested: ${order.order_number}`,
      updates.modification_notes ?? "",
      "design:view",
      `/admin/design`,
      "design_submission",
      submissionId
    );
    if (order.student_id) {
      await createNotification(
        order.student_id,
        "modification_requested",
        "Design needs modification",
        updates.modification_notes ?? "",
        `/student/orders/${submission.order_id}`
      );
    }
  }

  if (updates.status === "approved") {
    await supabase
      .from("orders")
      .update({ status: "ready_for_printing" })
      .eq("id", submission.order_id);

    await notifyAdminsAndEmployees(
      "design_approved",
      `Design approved: ${order.order_number}`,
      "",
      "printing:view",
      `/admin/printing`,
      "order",
      submission.order_id
    );
  }

  await logActivity(profile.id, "design_update", "design_submission", submissionId, updates);
  revalidatePath(`/student/orders/${submission.order_id}`);
  revalidatePath("/admin/design");
  return { success: true };
}

export async function uploadDesignPreview(
  orderId: string,
  submissionId: string,
  previewDataUrl: string
) {
  const profile = await requireAuth();
  if (profile.role === "employee") {
    await requirePermission("design:upload");
  } else if (profile.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const path = `${orderId}/${submissionId}-preview.png`;

  const uploaded = await uploadDataUrl(supabase, "designs", path, previewDataUrl, {
    validation: "preview",
    upsert: true,
  });

  await supabase
    .from("design_submissions")
    .update({ preview_url: uploaded.publicUrl })
    .eq("id", submissionId);

  await supabase
    .from("orders")
    .update({ status: "awaiting_approval" })
    .eq("id", orderId);

  const { data: order } = await supabase
    .from("orders")
    .select("student_id, representative_id, order_number")
    .eq("id", orderId)
    .single();

  if (order?.student_id) {
    await createNotification(
      order.student_id,
      "design_uploaded",
      "Design preview ready",
      `Order ${order.order_number}`,
      `/student/orders/${orderId}`
    );
  }

  await logActivity(profile.id, "upload_design_preview", "design_submission", submissionId, {
    order_id: orderId,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return { previewUrl: uploaded.publicUrl };
}

export async function getDefaultTemplateConfig(): Promise<TemplateConfig> {
  return {
    width: 400,
    height: 600,
    textSlots: [
      {
        id: "name",
        x: 200,
        y: 280,
        fontSize: 24,
        fontFamily: "Arial",
        color: "#FFD700",
        maxWidth: 300,
        align: "center",
        field: "full_name",
      },
      {
        id: "department",
        x: 200,
        y: 320,
        fontSize: 16,
        fontFamily: "Arial",
        color: "#FFFFFF",
        maxWidth: 300,
        align: "center",
        field: "department",
      },
      {
        id: "year",
        x: 200,
        y: 350,
        fontSize: 14,
        fontFamily: "Arial",
        color: "#CCCCCC",
        maxWidth: 200,
        align: "center",
        field: "graduation_year",
      },
    ],
    logoSlot: { x: 170, y: 100, width: 60, height: 60 },
  };
}
