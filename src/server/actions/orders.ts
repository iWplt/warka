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
  createNotificationInternal as createNotification,
  logActivityInternal as logActivity,
  notifyAdminsAndEmployees,
} from "@/lib/notifications/internal";
import { uploadDataUrl } from "@/lib/supabase/storage";
import { env } from "@/lib/env";
import { PRINTING_PIPELINE_STATUSES } from "@/lib/orders/status-flow";
import { nextStatusAfterDeposit, canStudentEditOrder, canEmbroideryEditOrder } from "@/lib/orders/state-machine";
import { EMBROIDERY_QUEUE_STATUSES } from "@/lib/orders/status-flow";
import {
  assertEmbroideryFieldUpdatesAllowed,
  buildEmbroideryContextDisplay,
  embroideryFieldsForProduct,
  embroideryPermissionsForProduct,
} from "@/lib/orders/embroidery-permissions";
import { getDepositSettings, getProductFieldPermissions, getSizePolicies } from "@/server/actions/settings";
import {
  assertStudentFieldUpdatesAllowed,
  buildBatchLockedSnapshot,
  buildStudentFieldsSnapshot,
  compactStringRecord,
  DEFAULT_PRODUCT_FIELD_PERMISSIONS,
  type ProductFieldPermissions,
} from "@/lib/orders/product-field-permissions";
import { getStudentBatchMembership } from "@/lib/batches/student-membership";
import { resolveSizePoliciesForContext } from "@/lib/settings/resolve-size-policies";
import type { BatchSettings } from "@/lib/settings/types";
import { calculateDeposit } from "@/lib/settings/deposit";
import { sendNewOrderAdminEmail, sendOrderStatusEmail } from "@/lib/email/send";
import { queueWhatsAppNotification } from "@/lib/messaging/dispatch";
import type { OrderItemMedia } from "@/lib/orders/order-item-details";
import type { OrderDetailStudent } from "@/lib/orders/parse-order-notes";
import type { NotificationType, OrderStatus, ProductType, EmbroideryPosition } from "@/types/database";
import { resolveEmbroideryPositions } from "@/lib/products/variants";

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
  embroidery_position: z.string().optional(),
  embroidery_style: z.string().optional(),
  thread_color: z.string().optional(),
  back_shape: z.string().optional(),
  embroidery_image_data_url: z.string().optional(),
  cap_side_image_data_url: z.string().optional(),
  cap_top_image_data_url: z.string().optional(),
  cap_side_notes: z.string().optional(),
  cap_top_notes: z.string().optional(),
  custom_measurements: z.string().optional(),
  batch_locked_fields: z.record(z.string()).optional(),
  student_fields: z.record(z.string()).optional(),
  customization_payload: z.any().optional(),
});

const createOrderSchema = z.object({
  type: z.enum(["individual", "group"]).default("individual"),
  notes: z.string().optional(),
  batch_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
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
  pay_deposit: z.boolean().optional(),
  deposit_method: z.enum(["cash", "bank_transfer", "zain_cash"]).optional(),
});

export async function submitOrderWithDeposit(
  input: z.infer<typeof createOrderSchema> & {
    deposit_method: "cash" | "bank_transfer" | "zain_cash";
  }
) {
  return createOrder({ ...input, pay_deposit: true });
}

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

async function signedStorageUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null | undefined
): Promise<string | null> {
  if (!path || !supabase) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const { data, error } = await supabase.storage.from("logos").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function resolveOrderItemMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: Array<{
    id: string;
    logo_url: string | null;
    embroidery_image_path: string | null;
    cap_side_embroidery_path: string | null;
    cap_top_embroidery_path: string | null;
    catalog_product_id?: string | null;
    customization_payload?: unknown;
  }>
): Promise<Record<string, OrderItemMedia>> {
  const catalogIds = [
    ...new Set(
      items
        .map((item) => item.catalog_product_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const productImageById = new Map<string, string | null>();
  if (catalogIds.length > 0 && supabase) {
    const { data: products } = await supabase
      .from("products")
      .select("id, image, image_path")
      .in("id", catalogIds);
    await Promise.all(
      (products ?? []).map(async (product) => {
        const raw = (product.image as string | null) || (product.image_path as string | null);
        const url = await signedStorageUrl(supabase, raw);
        productImageById.set(product.id as string, url);
      })
    );
  }

  const entries = await Promise.all(
    items.map(async (item) => {
      const [logoUrl, embroideryUrl, capSideUrl, capTopUrl] = await Promise.all([
        signedStorageUrl(supabase, item.logo_url),
        signedStorageUrl(supabase, item.embroidery_image_path),
        signedStorageUrl(supabase, item.cap_side_embroidery_path),
        signedStorageUrl(supabase, item.cap_top_embroidery_path),
      ]);

      const zoneImages: Record<string, string | null> = {};
      const payload = item.customization_payload;
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        const zones = (payload as { zones?: Array<Record<string, unknown>> }).zones;
        if (Array.isArray(zones)) {
          await Promise.all(
            zones.map(async (zone, index) => {
              const key =
                (typeof zone.zone_key === "string" && zone.zone_key) ||
                (typeof zone.zone_id === "string" && zone.zone_id) ||
                `zone-${index}`;
              const raw =
                (typeof zone.image_data_url === "string" && zone.image_data_url) ||
                (typeof zone.image_path === "string" && zone.image_path) ||
                null;
              if (!raw) return;
              zoneImages[key] = await signedStorageUrl(supabase, raw);
            })
          );
        }
      }

      return [
        item.id,
        {
          logoUrl,
          embroideryUrl,
          capSideUrl,
          capTopUrl,
          productImageUrl: item.catalog_product_id
            ? productImageById.get(item.catalog_product_id) ?? null
            : null,
          zoneImages: Object.keys(zoneImages).length > 0 ? zoneImages : undefined,
        },
      ] as const;
    })
  );
  return Object.fromEntries(entries);
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
  if (profile.role === "embroidery") {
    if (
      order.status === "cancelled" ||
      !EMBROIDERY_QUEUE_STATUSES.includes(order.status as OrderStatus)
    ) {
      return null;
    }
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

  let student: OrderDetailStudent | null = null;
  if (order.student_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, college, department, stage, class_name, graduation_year")
      .eq("id", order.student_id)
      .maybeSingle();
    if (profile) student = profile as OrderDetailStudent;
  }

  const itemMedia = await resolveOrderItemMedia(supabase, items ?? []);

  const { data: editLogs } = await supabase
    .from("activity_log")
    .select("id, action, created_at, metadata, profiles(full_name)")
    .eq("entity_type", "order")
    .eq("entity_id", orderId)
    .in("action", ["student_order_edit", "update_order"])
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    order,
    items: items ?? [],
    history: history ?? [],
    design,
    savedDesign,
    payments: payments ?? [],
    student,
    itemMedia,
    editLogs: (editLogs ?? []).map((row) => {
      const profiles = row.profiles as { full_name: string } | { full_name: string }[] | null;
      return {
        id: row.id as string,
        action: row.action as string,
        created_at: row.created_at as string,
        metadata: (row.metadata as Record<string, unknown> | null) ?? null,
        profiles: Array.isArray(profiles) ? profiles[0] ?? null : profiles,
      };
    }),
  };
}

export async function createOrder(input: z.infer<typeof createOrderSchema>) {
  const profile = await requireAuth();
  const data = createOrderSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  let orderItems = data.items;
  let resolvedBatchId = data.batch_id;

  if (profile.role === "student") {
    const membership = await getStudentBatchMembership(profile.id);
    if (membership) {
      if (!resolvedBatchId) resolvedBatchId = membership.batch.id;
      const permissionsMap = (await getProductFieldPermissions()) as Record<
        ProductType,
        ProductFieldPermissions
      >;
      const source = { ...membership.roster } as Record<string, unknown>;
      orderItems = data.items.map((item) => {
        const perms =
          permissionsMap[item.product_type] ??
          DEFAULT_PRODUCT_FIELD_PERMISSIONS[item.product_type];
        const locked = buildBatchLockedSnapshot(item.product_type, perms, source);
        const studentSnap = buildStudentFieldsSnapshot(item.product_type, perms, source);
        return {
          ...item,
          size: (locked.size as string) ?? item.size ?? membership.roster.size ?? undefined,
          sash_color: (locked.sash_color as string) ?? item.sash_color,
          fabric_type: (locked.fabric_type as string) ?? item.fabric_type,
          cap_type: (locked.cap_type as string) ?? item.cap_type,
          font_family: (studentSnap.font_family as string) ?? item.font_family,
          custom_text: (studentSnap.custom_text as string) ?? item.custom_text,
          batch_locked_fields: compactStringRecord(locked),
          student_fields: compactStringRecord({
            ...studentSnap,
            ...(item.student_fields ?? {}),
          }),
        };
      });
    }
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.unit_price, 0);
  const depositSettings = data.pay_deposit ? await getDepositSettings() : null;
  const depositRequired =
    depositSettings && data.pay_deposit ? calculateDeposit(subtotal, depositSettings) : 0;

  const orderPayload: Record<string, unknown> = {
    type: data.type,
    status: "new" as OrderStatus,
    subtotal,
    total: subtotal,
    notes: data.notes,
    batch_id: resolvedBatchId,
    deposit_required: depositRequired,
    is_locked: false,
  };

  if (profile.role === "student") {
    orderPayload.student_id = profile.id;
    if (resolvedBatchId && !orderPayload.representative_id) {
      const { data: batch } = await supabase
        .from("batches")
        .select("representative_id")
        .eq("id", resolvedBatchId)
        .maybeSingle();
      if (batch?.representative_id) {
        orderPayload.representative_id = batch.representative_id;
      }
    }
  } else if (profile.role === "representative") {
    orderPayload.representative_id = profile.id;
    if (data.type === "group") orderPayload.type = "group";
  } else if (profile.role === "admin" && data.batch_id) {
    const { data: batch } = await supabase
      .from("batches")
      .select("representative_id")
      .eq("id", data.batch_id)
      .maybeSingle();
    if (batch?.representative_id) {
      orderPayload.representative_id = batch.representative_id;
    }
  }

  if (data.student_id && profile.role !== "student") {
    orderPayload.student_id = data.student_id;
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
    orderItems.map(async (item, index) => {
      const {
        logo_data_url,
        embroidery_image_data_url,
        cap_side_image_data_url,
        cap_top_image_data_url,
        custom_measurements,
        student_fields,
        ...rest
      } = item;
      const row: Record<string, unknown> = { ...rest, order_id: order.id };

      const mergedStudentFields = {
        ...(student_fields ?? {}),
        ...(custom_measurements?.trim()
          ? { custom_measurements: custom_measurements.trim() }
          : {}),
      };
      if (Object.keys(mergedStudentFields).length > 0) {
        row.student_fields = mergedStudentFields;
      }

      const uploadOptional = async (
        dataUrl: string | undefined,
        fileLabel: string,
        column: string
      ) => {
        if (!dataUrl?.startsWith("data:")) return;
        const uploaded = await uploadDataUrl(
          supabase,
          "logos",
          `${profile.id}/${order.id}/${fileLabel}-${index}.png`,
          dataUrl,
          { validation: "logo" }
        );
        row[column] = uploaded.path;
      };

      await uploadOptional(logo_data_url, "logo", "logo_url");
      await uploadOptional(embroidery_image_data_url, "embroidery", "embroidery_image_path");
      await uploadOptional(cap_side_image_data_url, "cap-side", "cap_side_embroidery_path");
      await uploadOptional(cap_top_image_data_url, "cap-top", "cap_top_embroidery_path");

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

  const withDeposit =
    Boolean(data.pay_deposit && data.deposit_method) && profile.role === "student";
  let finalStatus: OrderStatus = "pending_review";
  const orderUpdate: Record<string, unknown> = { qr_code_path: qrPath };

  if (withDeposit && data.deposit_method) {
    await supabase.from("payments").insert({
      order_id: order.id,
      amount: depositRequired,
      method: data.deposit_method,
      payment_status: depositRequired >= subtotal ? "paid" : "partial",
      recorded_by: profile.id,
      notes: "Deposit (arabon)",
    });

    orderUpdate.deposit_paid_at = new Date().toISOString();
    orderUpdate.is_locked = true;
    finalStatus = nextStatusAfterDeposit();
  }

  orderUpdate.status = finalStatus;
  await supabase.from("orders").update(orderUpdate).eq("id", order.id);

  await supabase.from("order_status_history").insert({
    order_id: order.id,
    from_status: "new",
    to_status: finalStatus,
    changed_by: profile.id,
    notes: withDeposit ? "Deposit paid — order confirmed" : "Submitted for review",
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

  if (withDeposit && orderPayload.student_id) {
    queueWhatsAppNotification({
      eventType: "order_confirmed",
      orderId: order.id,
      studentId: orderPayload.student_id as string,
      variables: {
        order_number: order.order_number,
        deposit_amount: String(depositRequired),
        order_link: `/student/orders/${order.id}`,
      },
    });
  }

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

    if (order.student_id) {
      queueWhatsAppNotification({
        eventType: "ready_for_pickup",
        orderId,
        studentId: order.student_id,
        variables: {
          order_number: order.order_number,
          order_link: `/student/orders/${orderId}`,
        },
      });
    }
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
    .select("id, status, student_id, order_number, is_locked, deposit_paid_at")
    .eq("id", orderId)
    .single();

  if (!order || order.student_id !== profile.id) {
    throw new Error("Unauthorized");
  }
  if (order.is_locked || order.deposit_paid_at) {
    throw new Error("This order is locked and cannot be cancelled");
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

const studentItemUpdateSchema = z.object({
  item_id: z.string().uuid(),
  size: z.string().optional(),
  custom_text: z.string().optional(),
  special_notes: z.string().optional(),
  font_family: z.string().optional(),
  embroidery_position: z.string().optional(),
  embroidery_style: z.string().optional(),
  thread_color: z.string().optional(),
  back_shape: z.string().optional(),
  cap_side_notes: z.string().optional(),
  cap_top_notes: z.string().optional(),
  custom_measurements: z.string().optional(),
  embroidery_image_data_url: z.string().optional(),
  cap_side_image_data_url: z.string().optional(),
  cap_top_image_data_url: z.string().optional(),
});

export type StudentOrderEditItem = {
  id: string;
  product_type: ProductType;
  permissions: ProductFieldPermissions;
  lockedFields: Record<string, string>;
  values: Record<string, string>;
  lockedDisplay: { key: string; labelAr: string; labelEn: string; value: string }[];
  editableFields: { key: string; labelAr: string; labelEn: string; value: string }[];
};

export async function getStudentOrderEditContext(orderId: string) {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order || order.student_id !== profile.id) throw new Error("Unauthorized");

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
  const permissionsMap = (await getProductFieldPermissions()) as Record<
    ProductType,
    ProductFieldPermissions
  >;

  const { FIELD_LABELS } = await import("@/lib/orders/product-field-permissions");

  const editItems: StudentOrderEditItem[] = (items ?? []).map((raw) => {
    const item = raw as Record<string, unknown> & { id: string; product_type: ProductType };
    const perms = permissionsMap[item.product_type] ?? DEFAULT_PRODUCT_FIELD_PERMISSIONS[item.product_type];
    const locked = (item.batch_locked_fields ?? {}) as Record<string, string>;
    const studentFields = (item.student_fields ?? {}) as Record<string, string>;

    const lockedDisplay = perms.batch_locked_fields
      .map((key) => {
        const value = locked[key] ?? String(item[key] ?? "");
        if (!value) return null;
        const labels = FIELD_LABELS[key] ?? { ar: key, en: key };
        return { key, labelAr: labels.ar, labelEn: labels.en, value };
      })
      .filter(Boolean) as StudentOrderEditItem["lockedDisplay"];

    const editableFields = perms.student_editable_fields
      .filter((key) => !key.endsWith("_path"))
      .map((key) => {
        const value = String(studentFields[key] ?? item[key] ?? "");
        const labels = FIELD_LABELS[key] ?? { ar: key, en: key };
        return { key, labelAr: labels.ar, labelEn: labels.en, value };
      });

    return {
      id: item.id,
      product_type: item.product_type,
      permissions: perms,
      lockedFields: locked,
      values: Object.fromEntries(
        perms.student_editable_fields.map((k) => [k, String(studentFields[k] ?? item[k] ?? "")])
      ),
      lockedDisplay,
      editableFields,
    };
  });

  return {
    order,
    items: editItems,
    canEdit: canStudentEditOrder(order),
    itemMedia: await resolveOrderItemMedia(supabase, items ?? []),
    embroideryPositionsByType: await loadEmbroideryPositionsByType(supabase),
    sizePolicies: await resolveSizePoliciesForOrder(order.batch_id, supabase),
  };
}

async function resolveSizePoliciesForOrder(
  batchId: string | null | undefined,
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
) {
  const globalPolicies = await getSizePolicies();
  if (!batchId) return globalPolicies;

  const { data: batch } = await supabase
    .from("batches")
    .select("settings")
    .eq("id", batchId)
    .maybeSingle();

  return resolveSizePoliciesForContext({
    globalPolicies,
    batchSettings: (batch?.settings ?? null) as BatchSettings | null,
    isBatchStudent: true,
  });
}

async function loadEmbroideryPositionsByType(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
): Promise<Partial<Record<ProductType, EmbroideryPosition[]>>> {
  const { data: products } = await supabase
    .from("products")
    .select("product_type, embroidery_positions")
    .eq("is_active", true);

  const map: Partial<Record<ProductType, EmbroideryPosition[]>> = {};
  for (const row of products ?? []) {
    const type = row.product_type as ProductType;
    map[type] = resolveEmbroideryPositions(row.embroidery_positions ?? []);
  }
  return map;
}

export async function updateStudentOrder(
  orderId: string,
  updates: { notes?: string; items?: z.infer<typeof studentItemUpdateSchema>[] }
) {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase
    .from("orders")
    .select("id, student_id, status, is_locked, deposit_paid_at, batch_id, student_modified_count")
    .eq("id", orderId)
    .single();

  if (!order || order.student_id !== profile.id) {
    throw new Error("Unauthorized");
  }
  if (!canStudentEditOrder(order)) {
    throw new Error("Order is locked — contact the print shop to make changes");
  }

  const permissionsMap = (await getProductFieldPermissions()) as Record<
    ProductType,
    ProductFieldPermissions
  >;

  const changeLog: Record<string, unknown> = { items: [] as unknown[] };

  if (updates.items?.length) {
    for (const item of updates.items) {
      const parsed = studentItemUpdateSchema.parse(item);
      const { item_id, embroidery_image_data_url, cap_side_image_data_url, cap_top_image_data_url, ...fields } =
        parsed;

      const { data: existing } = await supabase
        .from("order_items")
        .select("*")
        .eq("id", item_id)
        .eq("order_id", orderId)
        .maybeSingle();

      if (!existing) continue;

      const perms =
        permissionsMap[existing.product_type as ProductType] ??
        DEFAULT_PRODUCT_FIELD_PERMISSIONS[existing.product_type as ProductType];

      assertStudentFieldUpdatesAllowed(order, existing.product_type as ProductType, perms, fields);

      const row: Record<string, unknown> = {};
      const nextStudentFields = {
        ...((existing.student_fields ?? {}) as Record<string, string>),
      };

      for (const [key, value] of Object.entries(fields)) {
        if (value === undefined) continue;
        row[key] = value;
        nextStudentFields[key] = value;
      }

      const uploadOptional = async (
        dataUrl: string | undefined,
        fileLabel: string,
        column: string
      ) => {
        if (!dataUrl?.startsWith("data:")) return;
        const uploaded = await uploadDataUrl(
          supabase,
          "logos",
          `${profile.id}/${orderId}/${fileLabel}-${item_id}.png`,
          dataUrl,
          { validation: "logo" }
        );
        row[column] = uploaded.path;
        nextStudentFields[column] = uploaded.path;
      };

      await uploadOptional(embroidery_image_data_url, "embroidery", "embroidery_image_path");
      await uploadOptional(cap_side_image_data_url, "cap-side", "cap_side_embroidery_path");
      await uploadOptional(cap_top_image_data_url, "cap-top", "cap_top_embroidery_path");

      row.student_fields = nextStudentFields;

      await supabase.from("order_items").update(row).eq("id", item_id);
      (changeLog.items as unknown[]).push({ item_id, fields: row });
    }

    await supabase
      .from("orders")
      .update({
        student_modified_at: new Date().toISOString(),
        student_modified_count: Number(order.student_modified_count ?? 0) + 1,
      })
      .eq("id", orderId);
  }

  if (updates.notes !== undefined) {
    await supabase.from("orders").update({ notes: updates.notes }).eq("id", orderId);
  }

  await logActivity(profile.id, "student_order_edit", "order", orderId, changeLog);
  revalidatePath(`/student/orders/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function getEmbroideryQueueOrders(status?: OrderStatus) {
  await requireRole(["embroidery", "admin"]);
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("orders")
    .select("*, profiles!orders_student_id_fkey(full_name, phone)")
    .eq("archived", false)
    .in("status", EMBROIDERY_QUEUE_STATUSES)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data } = await query;
  return data ?? [];
}

export async function getEmbroideryOrderEditContext(orderId: string) {
  await requireRole(["embroidery", "admin"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) throw new Error("Order not found");
  if (!canEmbroideryEditOrder(order)) {
    throw new Error("Order is not in embroidery workflow");
  }

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
  const { FIELD_LABELS } = await import("@/lib/orders/product-field-permissions");

  const editItems: StudentOrderEditItem[] = (items ?? []).map((raw) => {
    const item = raw as Record<string, unknown> & { id: string; product_type: ProductType };
    const perms = embroideryPermissionsForProduct(item.product_type);
    const locked = (item.batch_locked_fields ?? {}) as Record<string, string>;
    const studentFields = (item.student_fields ?? {}) as Record<string, string>;
    const editableKeys = embroideryFieldsForProduct(item.product_type);

    const lockedDisplay = buildEmbroideryContextDisplay(item.product_type, item, locked);

    const editableFields = editableKeys
      .filter((key) => !key.endsWith("_path"))
      .map((key) => {
        const value = String(studentFields[key] ?? item[key] ?? "");
        const labels = FIELD_LABELS[key] ?? { ar: key, en: key };
        return { key, labelAr: labels.ar, labelEn: labels.en, value };
      });

    return {
      id: item.id,
      product_type: item.product_type,
      permissions: perms,
      lockedFields: locked,
      values: Object.fromEntries(
        editableKeys.map((k) => [k, String(studentFields[k] ?? item[k] ?? "")])
      ),
      lockedDisplay,
      editableFields,
    };
  });

  return {
    order,
    items: editItems,
    canEdit: canEmbroideryEditOrder(order),
    itemMedia: await resolveOrderItemMedia(supabase, items ?? []),
    embroideryPositionsByType: await loadEmbroideryPositionsByType(supabase),
    sizePolicies: await resolveSizePoliciesForOrder(order.batch_id, supabase),
  };
}

export async function updateEmbroideryOrder(
  orderId: string,
  updates: { items?: z.infer<typeof studentItemUpdateSchema>[] }
) {
  const profile = await requireRole(["embroidery", "admin"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase.from("orders").select("id, status").eq("id", orderId).single();
  if (!order) throw new Error("Order not found");
  if (!canEmbroideryEditOrder(order)) {
    throw new Error("Order is not editable in embroidery workflow");
  }

  const changeLog: Record<string, unknown> = { items: [] as unknown[] };

  if (updates.items?.length) {
    for (const item of updates.items) {
      const parsed = studentItemUpdateSchema.parse(item);
      const { item_id, embroidery_image_data_url, cap_side_image_data_url, cap_top_image_data_url, ...fields } =
        parsed;

      const { data: existing } = await supabase
        .from("order_items")
        .select("*")
        .eq("id", item_id)
        .eq("order_id", orderId)
        .maybeSingle();

      if (!existing) continue;

      const batchLocked = (existing.batch_locked_fields ?? {}) as Record<string, string>;
      assertEmbroideryFieldUpdatesAllowed(
        existing.product_type as ProductType,
        batchLocked,
        fields
      );

      const row: Record<string, unknown> = {};
      const nextStudentFields = {
        ...((existing.student_fields ?? {}) as Record<string, string>),
      };

      for (const [key, value] of Object.entries(fields)) {
        if (value === undefined) continue;
        row[key] = value;
        nextStudentFields[key] = value;
      }

      const uploadOptional = async (
        dataUrl: string | undefined,
        fileLabel: string,
        column: string
      ) => {
        if (!dataUrl?.startsWith("data:")) return;
        const uploaded = await uploadDataUrl(
          supabase,
          "logos",
          `${profile.id}/${orderId}/${fileLabel}-${item_id}.png`,
          dataUrl,
          { validation: "logo" }
        );
        row[column] = uploaded.path;
        nextStudentFields[column] = uploaded.path;
      };

      await uploadOptional(embroidery_image_data_url, "embroidery", "embroidery_image_path");
      await uploadOptional(cap_side_image_data_url, "cap-side", "cap_side_embroidery_path");
      await uploadOptional(cap_top_image_data_url, "cap-top", "cap_top_embroidery_path");

      row.student_fields = nextStudentFields;

      await supabase.from("order_items").update(row).eq("id", item_id);
      (changeLog.items as unknown[]).push({ item_id, fields: row });
    }
  }

  await logActivity(profile.id, "embroidery_order_edit", "order", orderId, changeLog);
  revalidatePath(`/embroidery/orders/${orderId}`);
  revalidatePath(`/embroidery/orders/${orderId}/edit`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/student/orders/${orderId}`);
  return { success: true };
}

export async function unlockOrderForAdmin(orderId: string, reason?: string) {
  const profile = await requirePermission("orders:edit");
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase
    .from("orders")
    .select("id, is_locked")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("Order not found");

  await supabase
    .from("orders")
    .update({ is_locked: false })
    .eq("id", orderId);

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    notes: reason ?? "Unlocked by admin for student edits",
    changed_by: profile.id,
  });

  await logActivity(profile.id, "unlock_order", "order", orderId, { reason });
  revalidatePath(`/admin/orders/${orderId}`);
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
