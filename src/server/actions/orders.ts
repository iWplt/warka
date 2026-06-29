"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentProfile,
  requireAuth,
  requireRole,
  requirePermission,
} from "@/lib/auth/guards";
import {
  createNotification,
  logActivity,
  notifyAdminsAndEmployees,
} from "@/server/actions/notifications";
import { uploadDataUrl } from "@/lib/supabase/storage";
import { env } from "@/lib/env";
import { PRINTING_PIPELINE_STATUSES } from "@/lib/orders/status-flow";
import { sendNewOrderAdminEmail, sendOrderStatusEmail } from "@/lib/email/send";
import type { NotificationType, OrderStatus, ProductType } from "@/types/database";

const orderItemSchema = z.object({
  product_type: z.enum(["sash", "cap", "gown", "suit", "custom"]),
  catalog_product_id: z.string().uuid().optional(),
  product_label: z.string().optional(),
  size: z.string().optional(),
  sash_color: z.string().optional(),
  fabric_type: z.string().optional(),
  cap_type: z.string().optional(),
  custom_text: z.string().optional(),
  special_notes: z.string().optional(),
  font_family: z.string().optional(),
  logo_url: z.string().optional(),
  template_id: z.string().uuid().optional(),
  unit_price: z.number().min(0),
  logo_data_url: z.string().optional(),
});

const createOrderSchema = z.object({
  type: z.enum(["individual", "group"]).default("individual"),
  notes: z.string().optional(),
  batch_id: z.string().uuid().optional(),
  items: z.array(orderItemSchema).min(1),
  customizations: z.record(z.string()).optional(),
  template_id: z.string().uuid().optional(),
  design_id: z.string().uuid().optional(),
  logo_data_url: z.string().optional(),
  student_profile: z
    .object({
      full_name: z.string().optional(),
      phone: z.string().optional(),
      college: z.string().optional(),
      department: z.string().optional(),
      stage: z.string().optional(),
      class_name: z.string().optional(),
      graduation_year: z.coerce.number().optional(),
    })
    .optional(),
});

export async function getOrders(filters?: {
  status?: OrderStatus;
  search?: string;
  archived?: boolean;
}) {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("orders")
    .select("*, profiles!orders_student_id_fkey(full_name, phone)")
    .eq("archived", filters?.archived ?? false)
    .order("created_at", { ascending: false });

  if (profile.role === "student") {
    query = query.eq("student_id", profile.id);
  } else if (profile.role === "representative") {
    query = query.eq("representative_id", profile.id);
  } else if (profile.role === "employee") {
    query = query.in("status", PRINTING_PIPELINE_STATUSES);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.ilike("order_number", `%${filters.search}%`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getOrderById(orderId: string) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return null;

  if (profile.role === "representative" && order.representative_id !== profile.id) {
    return null;
  }
  if (profile.role === "student" && order.student_id !== profile.id) {
    return null;
  }
  if (
    profile.role === "employee" &&
    !PRINTING_PIPELINE_STATUSES.includes(order.status as OrderStatus)
  ) {
    return null;
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  const { data: history } = await supabase
    .from("order_status_history")
    .select("*, profiles(full_name)")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const { data: design } = await supabase
    .from("design_submissions")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let savedDesign = null;
  if (order.design_id) {
    const { data } = await supabase
      .from("designs")
      .select("*")
      .eq("id", order.design_id)
      .maybeSingle();
    savedDesign = data;
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId);

  return {
    order,
    items: items ?? [],
    history: history ?? [],
    design,
    savedDesign,
    payments: payments ?? [],
  };
}

export async function createOrder(input: z.infer<typeof createOrderSchema>) {
  const profile = await requireAuth();
  const data = createOrderSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const subtotal = data.items.reduce((sum, item) => sum + item.unit_price, 0);

  const orderPayload: Record<string, unknown> = {
    type: data.type,
    status: "new" as OrderStatus,
    subtotal,
    total: subtotal,
    notes: data.notes,
    batch_id: data.batch_id,
  };

  if (profile.role === "student") {
    orderPayload.student_id = profile.id;
  } else if (profile.role === "representative") {
    orderPayload.representative_id = profile.id;
    orderPayload.type = "group";
  }

  if (data.design_id) {
    orderPayload.design_id = data.design_id;
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (profile.role === "student" && data.student_profile) {
    const { syncStudentProfileFromOrder } = await import("@/server/actions/profile");
    await syncStudentProfileFromOrder(data.student_profile);
  }

  const items = await Promise.all(
    data.items.map(async (item, index) => {
      const { logo_data_url, ...rest } = item;
      const row: Record<string, unknown> = { ...rest, order_id: order.id };

      if (logo_data_url?.startsWith("data:")) {
        const uploaded = await uploadDataUrl(
          supabase,
          "logos",
          `${profile.id}/${order.id}/item-${index}.png`,
          logo_data_url,
          { validation: "logo" }
        );
        row.logo_url = uploaded.path;
      }

      return row;
    })
  );

  if (
    data.logo_data_url?.startsWith("data:") &&
    profile.role === "student" &&
    !data.items.some((item) => item.logo_data_url?.startsWith("data:"))
  ) {
    const uploaded = await uploadDataUrl(
      supabase,
      "logos",
      `${profile.id}/${order.id}/logo.png`,
      data.logo_data_url,
      { validation: "logo" }
    );
    if (items[0]) {
      items[0].logo_url = uploaded.path;
    }
  }

  await supabase.from("order_items").insert(items);

  await supabase.from("order_status_history").insert({
    order_id: order.id,
    to_status: "new",
    changed_by: profile.id,
    notes: "Order created",
  });

  if (data.template_id && data.customizations) {
    await supabase.from("design_submissions").insert({
      order_id: order.id,
      template_id: data.template_id,
      customizations: data.customizations,
      preview_url: null,
      status: "pending",
    });
  }

  const qrUrl = `${env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl);
  const qrBase64 = qrDataUrl.split(",")[1];
  const qrBuffer = Buffer.from(qrBase64, "base64");
  const qrPath = `${order.id}/qr.png`;

  await supabase.storage.from("qr-codes").upload(qrPath, qrBuffer, {
    contentType: "image/png",
    upsert: true,
  });

  await supabase
    .from("orders")
    .update({ qr_code_path: qrPath, status: "pending_review" })
    .eq("id", order.id);

  await supabase.from("order_status_history").insert({
    order_id: order.id,
    from_status: "new",
    to_status: "pending_review",
    changed_by: profile.id,
  });

  await notifyAdminsAndEmployees(
    data.type === "group" ? "new_group_order" : "new_order",
    `New order ${order.order_number}`,
    data.notes ?? "",
    "orders:view",
    `/admin/orders/${order.id}`,
    "order",
    order.id
  );

  await logActivity(profile.id, "create_order", "order", order.id);

  const studentLink = `/student/orders/${order.id}`;
  if (profile.role === "student" && profile.email) {
    await sendOrderStatusEmail(
      profile.email,
      order.order_number,
      "Submitted",
      studentLink
    );
  }
  await sendNewOrderAdminEmail(order.order_number, `/admin/orders/${order.id}`);

  revalidatePath("/admin/orders");
  revalidatePath("/student/orders");
  revalidatePath("/representative/orders");
  revalidatePath("/employee/orders");

  return order;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
) {
  const profile = await requireAuth();
  if (profile.role === "employee") {
    await requirePermission("orders:status");
  } else if (profile.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase
    .from("orders")
    .select("status, student_id, representative_id, order_number")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("Order not found");

  await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    from_status: order.status,
    to_status: newStatus,
    changed_by: profile.id,
    notes,
  });

  const notifyUserId = order.student_id ?? order.representative_id;
  const rolePath =
    order.student_id === notifyUserId ? "student" : "representative";

  const statusNotificationMap: Partial<Record<OrderStatus, NotificationType>> = {
    cancelled: "general",
    awaiting_approval: "design_uploaded",
    needs_modification: "modification_requested",
    ready_for_printing: "ready_for_printing",
    printing: "printing_started",
    ready_for_delivery: "ready_for_delivery",
    delivered: "general",
  };

  if (notifyUserId) {
    const notifType = statusNotificationMap[newStatus] ?? "general";
    await createNotification(
      notifyUserId,
      notifType,
      `Order ${order.order_number}`,
      newStatus,
      `/${rolePath}/orders/${orderId}`,
      "order",
      orderId
    );

    const { data: recipient } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", notifyUserId)
      .maybeSingle();

    if (recipient?.email) {
      await sendOrderStatusEmail(
        recipient.email,
        order.order_number,
        newStatus.replace(/_/g, " "),
        `/${rolePath}/orders/${orderId}`
      );
    }
  }

  if (newStatus === "delivered" && order.student_id) {
    await createNotification(
      order.student_id,
      "general",
      `Order ${order.order_number} delivered`,
      "",
      `/student/orders/${orderId}`,
      "order",
      orderId
    );
  }

  if (newStatus === "ready_for_printing") {
    await notifyAdminsAndEmployees(
      "ready_for_printing",
      `Order ${order.order_number} ready for printing`,
      "",
      "printing:view",
      `/admin/printing`,
      "order",
      orderId
    );
  }

  if (newStatus === "printing") {
    await notifyAdminsAndEmployees(
      "printing_started",
      `Printing started: ${order.order_number}`,
      "",
      "printing:view",
      `/admin/printing`,
      "order",
      orderId
    );
  }

  if (newStatus === "ready_for_delivery") {
    await notifyAdminsAndEmployees(
      "ready_for_delivery",
      `Ready for delivery: ${order.order_number}`,
      "",
      "delivery:view",
      `/admin/delivery`,
      "order",
      orderId
    );
  }

  await logActivity(profile.id, "status_change", "order", orderId, {
    from: order.status,
    to: newStatus,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/employee/orders/${orderId}`);
  revalidatePath("/employee/orders");
  return { success: true };
}

export async function getPrintingQueueOrders(status?: OrderStatus) {
  await requireRole(["employee"]);
  await requirePermission("printing:view");

  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("orders")
    .select("*, profiles!orders_student_id_fkey(full_name, phone)")
    .eq("archived", false)
    .in("status", PRINTING_PIPELINE_STATUSES)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return data ?? [];
}

export async function assignOrder(orderId: string, employeeId: string) {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  await supabase
    .from("orders")
    .update({ assigned_employee_id: employeeId, status: "designing" })
    .eq("id", orderId);

  await createNotification(
    employeeId,
    "general",
    "New order assigned to you",
    "",
    `/admin/orders/${orderId}`,
    "order",
    orderId
  );

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function addOrderNote(orderId: string, note: string) {
  const profile = await requireAuth();
  if (profile.role === "employee") {
    await requirePermission("orders:notes");
  }

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase
    .from("orders")
    .select("shop_notes")
    .eq("id", orderId)
    .single();

  const existing = order?.shop_notes ?? "";
  const updated = existing ? `${existing}\n${note}` : note;

  await supabase
    .from("orders")
    .update({ shop_notes: updated })
    .eq("id", orderId);

  await logActivity(profile.id, "add_note", "order", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function archiveOrder(orderId: string) {
  const profile = await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  await supabase.from("orders").update({ archived: true }).eq("id", orderId);
  await logActivity(profile.id, "archive_order", "order", orderId);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function unarchiveOrder(orderId: string) {
  const profile = await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  await supabase.from("orders").update({ archived: false }).eq("id", orderId);
  await logActivity(profile.id, "unarchive_order", "order", orderId);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function cancelOrder(orderId: string, reason?: string) {
  return updateOrderStatus(orderId, "cancelled", reason);
}

const STUDENT_CANCELLABLE: OrderStatus[] = [
  "new",
  "pending_review",
  "needs_modification",
  "awaiting_approval",
];

export async function cancelOrderByStudent(orderId: string, reason?: string) {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, student_id, order_number")
    .eq("id", orderId)
    .single();

  if (!order || order.student_id !== profile.id) {
    throw new Error("Unauthorized");
  }
  if (!STUDENT_CANCELLABLE.includes(order.status as OrderStatus)) {
    throw new Error("This order can no longer be cancelled");
  }

  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    from_status: order.status,
    to_status: "cancelled",
    changed_by: profile.id,
    notes: reason ?? "Cancelled by student",
  });

  await logActivity(profile.id, "cancel_order", "order", orderId, { reason });
  revalidatePath("/student/orders");
  revalidatePath(`/student/orders/${orderId}`);
  return { success: true };
}

export async function getPriceForProduct(productType: ProductType) {
  const supabase = await createClient();
  if (!supabase) return 0;

  const { data } = await supabase
    .from("price_catalog")
    .select("base_price")
    .eq("product_type", productType)
    .eq("active", true)
    .single();

  return data?.base_price ?? 0;
}
