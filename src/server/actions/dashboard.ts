"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import type { OrderStatus, OrderType } from "@/types/database";

export type DashboardRecentOrder = {
  id: string;
  order_number: string;
  status: OrderStatus;
  type: OrderType;
  total: number;
  created_at: string;
  student_name: string | null;
};

export type AdminDashboardData = {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    revenueThisMonth: number;
    activeStudents: number;
    designing: number;
    printing: number;
    unpaid: number;
    deliveredToday: number;
  };
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
  paymentOverview: { paid: number; unpaid: number; partial: number };
  recentOrders: DashboardRecentOrder[];
  readyForDelivery: DashboardRecentOrder[];
};

const PENDING_STATUSES: OrderStatus[] = [
  "new",
  "pending_review",
  "needs_modification",
];

/**
 * Loads aggregated metrics for the admin dashboard overview.
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData | null> {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) return null;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: totalOrders },
    { data: allOrders },
    { count: activeStudents },
    { count: deliveredToday },
    { data: recentRows },
    { data: deliveryRows },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("archived", false),
    supabase
      .from("orders")
      .select("status, total, created_at, payments(amount)")
      .eq("archived", false),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .eq("is_active", true),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivered")
      .gte("updated_at", today.toISOString()),
    supabase
      .from("orders")
      .select("id, order_number, status, type, total, created_at, profiles!orders_student_id_fkey(full_name)")
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("orders")
      .select("id, order_number, status, type, total, created_at, profiles!orders_student_id_fkey(full_name)")
      .eq("status", "ready_for_delivery")
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  const statusCounts = new Map<OrderStatus, number>();
  let revenueThisMonth = 0;
  let pendingOrders = 0;
  let designing = 0;
  let printing = 0;
  let unpaid = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;

  for (const order of allOrders ?? []) {
    const status = order.status as OrderStatus;
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);

    if (PENDING_STATUSES.includes(status)) pendingOrders += 1;
    if (status === "designing") designing += 1;
    if (status === "printing" || status === "ready_for_printing") printing += 1;

    const paid = (order.payments as { amount: number }[]).reduce(
      (sum, row) => sum + Number(row.amount),
      0
    );
    const total = Number(order.total);

    if (paid >= total && total > 0) paidCount += 1;
    else if (paid > 0) partialCount += 1;
    else unpaidCount += 1;

    if (paid < total) unpaid += 1;

    if (new Date(order.created_at) >= monthStart && status === "delivered") {
      revenueThisMonth += total;
    }
  }

  const ordersByStatus = Array.from(statusCounts.entries())
    .map(([status, count]) => ({ status, count }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const mapOrder = (row: Record<string, unknown>): DashboardRecentOrder => {
    const profile = row.profiles as { full_name: string } | { full_name: string }[] | null;
    const student = Array.isArray(profile) ? profile[0] : profile;
    return {
      id: row.id as string,
      order_number: row.order_number as string,
      status: row.status as OrderStatus,
      type: row.type as OrderType,
      total: Number(row.total),
      created_at: row.created_at as string,
      student_name: student?.full_name ?? null,
    };
  };

  return {
    stats: {
      totalOrders: totalOrders ?? 0,
      pendingOrders,
      revenueThisMonth,
      activeStudents: activeStudents ?? 0,
      designing,
      printing,
      unpaid,
      deliveredToday: deliveredToday ?? 0,
    },
    ordersByStatus,
    paymentOverview: {
      paid: paidCount,
      unpaid: unpaidCount,
      partial: partialCount,
    },
    recentOrders: (recentRows ?? []).map((row) => mapOrder(row as Record<string, unknown>)),
    readyForDelivery: (deliveryRows ?? []).map((row) => mapOrder(row as Record<string, unknown>)),
  };
}

export type StudentDashboardData = {
  stats: {
    totalOrders: number;
    activeOrders: number;
    awaitingApproval: number;
    delivered: number;
    balanceDue: number;
  };
  recentOrders: Array<{
    id: string;
    order_number: string;
    status: OrderStatus;
    total: number;
    created_at: string;
  }>;
  activeOrder: {
    id: string;
    order_number: string;
    status: OrderStatus;
    total: number;
  } | null;
};

const ACTIVE_STATUSES: OrderStatus[] = [
  "new",
  "pending_review",
  "designing",
  "awaiting_approval",
  "needs_modification",
  "ready_for_printing",
  "printing",
  "printed",
  "ready_for_delivery",
];

export async function getStudentDashboardData(): Promise<StudentDashboardData | null> {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at, payments(amount)")
    .eq("student_id", profile.id)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  const rows = orders ?? [];
  let balanceDue = 0;

  for (const order of rows) {
    const paid = (order.payments as { amount: number }[]).reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    balanceDue += Math.max(Number(order.total) - paid, 0);
  }

  const activeOrder =
    rows.find((order) => ACTIVE_STATUSES.includes(order.status as OrderStatus)) ?? null;

  return {
    stats: {
      totalOrders: rows.length,
      activeOrders: rows.filter((order) =>
        ACTIVE_STATUSES.includes(order.status as OrderStatus)
      ).length,
      awaitingApproval: rows.filter((order) => order.status === "awaiting_approval").length,
      delivered: rows.filter((order) => order.status === "delivered").length,
      balanceDue,
    },
    recentOrders: rows.slice(0, 5).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status as OrderStatus,
      total: Number(order.total),
      created_at: order.created_at,
    })),
    activeOrder: activeOrder
      ? {
          id: activeOrder.id,
          order_number: activeOrder.order_number,
          status: activeOrder.status as OrderStatus,
          total: Number(activeOrder.total),
        }
      : null,
  };
}

export type EmployeeDashboardData = {
  readyCount: number;
  printingCount: number;
  readyDeliveryCount: number;
  recentOrders: DashboardRecentOrder[];
};

export async function getEmployeeDashboardData(): Promise<EmployeeDashboardData | null> {
  await requireRole(["employee"]);

  const supabase = await createClient();
  if (!supabase) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at, profiles!orders_student_id_fkey(full_name)")
    .eq("archived", false)
    .in("status", ["ready_for_printing", "printing", "printed", "ready_for_delivery", "delivered"])
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = orders ?? [];

  const mapOrder = (order: (typeof rows)[number]): DashboardRecentOrder => {
    const profile = order.profiles as { full_name: string } | { full_name: string }[] | null;
    const student = Array.isArray(profile) ? profile[0] : profile;
    return {
      id: order.id,
      order_number: order.order_number,
      status: order.status as OrderStatus,
      type: "individual",
      total: Number(order.total),
      created_at: order.created_at,
      student_name: student?.full_name ?? null,
    };
  };

  return {
    readyCount: rows.filter((o) => o.status === "ready_for_printing").length,
    printingCount: rows.filter((o) => o.status === "printing" || o.status === "printed").length,
    readyDeliveryCount: rows.filter((o) => o.status === "ready_for_delivery").length,
    recentOrders: rows.slice(0, 8).map(mapOrder),
  };
}
