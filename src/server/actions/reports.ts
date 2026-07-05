"use server";

import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireRole } from "@/lib/auth/guards";
import { PRINTING_PIPELINE_STATUSES } from "@/lib/orders/status-flow";
import { env } from "@/lib/env";

export async function getDashboardStats() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: newOrders },
    { count: designing },
    { count: printing },
    { count: deliveredToday },
    { data: unpaidOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "designing"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["printing", "ready_for_printing"]),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivered")
      .gte("updated_at", today.toISOString()),
    supabase
      .from("orders")
      .select("id, total, payments(amount)")
      .eq("archived", false)
      .neq("status", "cancelled"),
  ]);

  const unpaid = (unpaidOrders ?? []).filter((o) => {
    const paid = (o.payments as { amount: number }[]).reduce(
      (s, p) => s + Number(p.amount),
      0
    );
    return paid < Number(o.total);
  }).length;

  return { newOrders: newOrders ?? 0, designing: designing ?? 0, printing: printing ?? 0, unpaid, deliveredToday: deliveredToday ?? 0 };
}

export async function exportOrdersExcel(filters?: {
  status?: string;
  from?: string;
  to?: string;
}) {
  await requireRole(["admin"]);

  const orders = await fetchOrdersForExport(filters);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Orders");

  sheet.columns = [
    { header: "Order Number", key: "order_number", width: 20 },
    { header: "Student", key: "student", width: 25 },
    { header: "Status", key: "status", width: 20 },
    { header: "Total", key: "total", width: 12 },
    { header: "Date", key: "created_at", width: 20 },
  ];

  orders.forEach((order) => {
    const profiles = order.profiles as { full_name: string } | { full_name: string }[] | null;
    const studentProfile = Array.isArray(profiles) ? profiles[0] : profiles;
    sheet.addRow({
      order_number: order.order_number,
      student: studentProfile?.full_name ?? "",
      status: order.status,
      total: order.total,
      created_at: order.created_at,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function fetchOrdersForExport(filters?: {
  status?: string;
  from?: string;
  to?: string;
  includeArchived?: boolean;
}) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  let query = supabase
    .from("orders")
    .select("order_number, status, total, created_at, archived, profiles!orders_student_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (!filters?.includeArchived) {
    query = query.eq("archived", false);
  }

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.from) query = query.gte("created_at", filters.from);
  if (filters?.to) query = query.lte("created_at", filters.to);

  const { data: orders } = await query;
  return orders ?? [];
}

export async function exportOrdersPdf(filters?: {
  status?: string;
  from?: string;
  to?: string;
}) {
  await requireRole(["admin"]);

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const orders = await fetchOrdersForExport(filters);
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Orders Report", 14, 18);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

  autoTable(doc, {
    startY: 32,
    head: [["Order #", "Student", "Status", "Total (IQD)", "Date"]],
    body: orders.map((order) => {
      const profiles = order.profiles as { full_name: string } | { full_name: string }[] | null;
      const studentProfile = Array.isArray(profiles) ? profiles[0] : profiles;
      return [
        order.order_number,
        studentProfile?.full_name ?? "",
        order.status,
        String(order.total),
        new Date(order.created_at).toLocaleDateString(),
      ];
    }),
  });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer).toString("base64");
}

export async function getActivityLog(limit = 50) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("activity_log")
    .select("id, action, entity_type, entity_id, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const profile = row.profiles as { full_name: string } | { full_name: string }[] | null;
    const user = Array.isArray(profile) ? profile[0] : profile;
    return {
      id: row.id as string,
      action: row.action as string,
      entity_type: row.entity_type as string | null,
      entity_id: row.entity_id as string | null,
      created_at: row.created_at as string,
      profiles: user ?? null,
    };
  });
}

export async function getOrdersByStatus() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return {};

  const supabase = await createClient();
  if (!supabase) return {};

  const statuses = [
    "new", "pending_review", "designing", "awaiting_approval",
    "needs_modification", "ready_for_printing", "printing",
    "printed", "ready_for_delivery", "delivered", "cancelled",
  ] as const;

  const result = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<
    (typeof statuses)[number],
    number
  >;

  const { data } = await supabase.from("orders").select("status");

  for (const row of data ?? []) {
    const status = row.status as (typeof statuses)[number];
    if (status in result) {
      result[status] += 1;
    }
  }

  return result;
}

export async function exportStudentsExcel() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: students } = await supabase
    .from("profiles")
    .select("full_name, email, phone, college, department, graduation_year, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Students");
  sheet.columns = [
    { header: "Name", key: "full_name", width: 28 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "College", key: "college", width: 20 },
    { header: "Department", key: "department", width: 20 },
    { header: "Year", key: "graduation_year", width: 10 },
    { header: "Joined", key: "created_at", width: 20 },
  ];

  for (const row of students ?? []) {
    sheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function exportSalesExcel() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, method, payment_status, created_at, orders(order_number, total)")
    .order("created_at", { ascending: false });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sales");
  sheet.columns = [
    { header: "Order", key: "order_number", width: 18 },
    { header: "Amount", key: "amount", width: 12 },
    { header: "Method", key: "method", width: 14 },
    { header: "Status", key: "payment_status", width: 12 },
    { header: "Date", key: "created_at", width: 20 },
  ];

  for (const row of payments ?? []) {
    const orderRaw = row.orders as
      | { order_number: string; total: number }
      | { order_number: string; total: number }[]
      | null;
    const order = Array.isArray(orderRaw) ? orderRaw[0] : orderRaw;
    sheet.addRow({
      order_number: order?.order_number ?? "",
      amount: row.amount,
      method: row.method,
      payment_status: row.payment_status,
      created_at: row.created_at,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function exportOrderInvoicePdf(orderId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  if (!["admin", "student", "representative", "employee"].includes(profile.role)) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase
    .from("orders")
    .select("*, profiles!orders_student_id_fkey(full_name, phone, college, department)")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("Order not found");

  if (profile.role === "student" && order.student_id !== profile.id) {
    throw new Error("Unauthorized");
  }
  if (profile.role === "representative" && order.representative_id !== profile.id) {
    throw new Error("Unauthorized");
  }
  if (
    profile.role === "employee" &&
    !PRINTING_PIPELINE_STATUSES.includes(order.status as (typeof PRINTING_PIPELINE_STATUSES)[number])
  ) {
    throw new Error("Unauthorized");
  }

  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", orderId),
    supabase.from("payments").select("*").eq("order_id", orderId).order("created_at"),
  ]);

  const catalogIds = [...new Set((items ?? []).map((i) => i.catalog_product_id).filter(Boolean))];
  const productNames: Record<string, { name_ar: string; name_en: string }> = {};

  if (catalogIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name_ar, name_en")
      .in("id", catalogIds as string[]);

    for (const product of products ?? []) {
      productNames[product.id] = {
        name_ar: product.name_ar,
        name_en: product.name_en,
      };
    }
  }

  const trackPath =
    profile.role === "student"
      ? `/student/orders/${orderId}`
      : `/admin/orders/${orderId}`;
  const trackUrl = `${env.NEXT_PUBLIC_APP_URL}${trackPath}`;

  const studentProfile = order.profiles as {
    full_name: string;
    phone: string | null;
    college: string | null;
    department: string | null;
  } | null;

  const { buildOrderInvoicePdf } = await import("@/lib/invoices/order-invoice-pdf");
  const arrayBuffer = await buildOrderInvoicePdf({
    order,
    student: studentProfile,
    items: items ?? [],
    payments: payments ?? [],
    productNames,
    trackUrl,
  });

  return Buffer.from(arrayBuffer).toString("base64");
}
