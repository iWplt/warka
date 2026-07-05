"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import type {
  Batch,
  BatchStudent,
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  Profile,
} from "@/types/database";

export type StudentAuditEntry = {
  id: string;
  kind: "activity" | "status_change";
  action: string;
  notes: string | null;
  actor_name: string | null;
  created_at: string;
  order_id: string | null;
  order_number: string | null;
};

export type StudentBatchMembership = {
  batch: Pick<Batch, "id" | "name" | "college" | "department" | "graduation_year" | "status">;
  roster: BatchStudent;
};

export type StudentOrderSummary = Order & {
  items: OrderItem[];
  paid: number;
  balance: number;
};

export type StudentAdminDashboard = {
  profile: Profile;
  batches: StudentBatchMembership[];
  orders: StudentOrderSummary[];
  payments: Payment[];
  auditTrail: StudentAuditEntry[];
  stats: {
    totalOrders: number;
    activeOrders: number;
    totalPaid: number;
    balanceDue: number;
  };
};

export async function getStudentAdminDashboard(
  studentId: string
): Promise<StudentAdminDashboard | null> {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .eq("role", "student")
    .maybeSingle();

  if (!profile) return null;

  const [{ data: rosterRows }, { data: orders }] = await Promise.all([
    supabase
      .from("batch_students")
      .select("*, batches(id, name, college, department, graduation_year, status)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*")
      .eq("student_id", studentId)
      .eq("archived", false)
      .order("created_at", { ascending: false }),
  ]);

  const orderList = orders ?? [];
  const orderIds = orderList.map((o) => o.id);
  const orderNumberById = new Map(orderList.map((o) => [o.id, o.order_number]));

  const [{ data: items }, { data: payments }] = await Promise.all([
    orderIds.length > 0
      ? supabase.from("order_items").select("*").in("order_id", orderIds)
      : Promise.resolve({ data: [] as OrderItem[] }),
    orderIds.length > 0
      ? supabase
          .from("payments")
          .select("*")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Payment[] }),
  ]);

  const activityQueries = [
    supabase
      .from("activity_log")
      .select("id, action, entity_type, entity_id, metadata, created_at, profiles(full_name)")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(50),
  ];

  if (orderIds.length > 0) {
    activityQueries.push(
      supabase
        .from("activity_log")
        .select("id, action, entity_type, entity_id, metadata, created_at, profiles(full_name)")
        .eq("entity_type", "order")
        .in("entity_id", orderIds)
        .order("created_at", { ascending: false })
        .limit(50)
    );
  }

  activityQueries.push(
    supabase
      .from("activity_log")
      .select("id, action, entity_type, entity_id, metadata, created_at, profiles(full_name)")
      .eq("entity_type", "profile")
      .eq("entity_id", studentId)
      .order("created_at", { ascending: false })
      .limit(20)
  );

  const activityResults = await Promise.all(activityQueries);
  const activityMap = new Map<string, Record<string, unknown>>();
  for (const result of activityResults) {
    for (const row of result.data ?? []) {
      activityMap.set(row.id as string, row as Record<string, unknown>);
    }
  }
  const activity = [...activityMap.values()];

  const { data: statusHistory } =
    orderIds.length > 0
      ? await supabase
          .from("order_status_history")
          .select("*, profiles(full_name)")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false })
      : { data: [] as OrderStatusHistory[] };

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item as OrderItem);
    itemsByOrder.set(item.order_id, list);
  }

  const paidByOrder = new Map<string, number>();
  for (const payment of payments ?? []) {
    paidByOrder.set(
      payment.order_id,
      (paidByOrder.get(payment.order_id) ?? 0) + Number(payment.amount)
    );
  }

  const ordersWithSummary: StudentOrderSummary[] = orderList.map((order) => {
    const paid = paidByOrder.get(order.id) ?? 0;
    const total = Number(order.total);
    return {
      ...(order as Order),
      items: itemsByOrder.get(order.id) ?? [],
      paid,
      balance: Math.max(0, total - paid),
    };
  });

  const batches: StudentBatchMembership[] = (rosterRows ?? [])
    .map((row) => {
      const batchRaw = row.batches as Batch | Batch[] | null;
      const batch = Array.isArray(batchRaw) ? batchRaw[0] : batchRaw;
      if (!batch) return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { batches: _ignored, ...roster } = row;
      return {
        batch: {
          id: batch.id,
          name: batch.name,
          college: batch.college,
          department: batch.department,
          graduation_year: batch.graduation_year,
          status: batch.status,
        },
        roster: roster as BatchStudent,
      };
    })
    .filter((row): row is StudentBatchMembership => row !== null);

  const auditTrail: StudentAuditEntry[] = [];

  for (const entry of activity) {
    const actor = entry.profiles as
      | { full_name: string }
      | { full_name: string }[]
      | null
      | undefined;
    const actorName = Array.isArray(actor) ? actor[0]?.full_name : actor?.full_name;
    const orderId =
      entry.entity_type === "order" && entry.entity_id ? String(entry.entity_id) : null;
    auditTrail.push({
      id: `act-${entry.id}`,
      kind: "activity",
      action: entry.action as string,
      notes: null,
      actor_name: actorName ?? null,
      created_at: entry.created_at as string,
      order_id: orderId,
      order_number: orderId ? orderNumberById.get(orderId) ?? null : null,
    });
  }

  for (const row of statusHistory ?? []) {
    const actor = row.profiles as { full_name: string } | { full_name: string }[] | null;
    const actorName = Array.isArray(actor) ? actor[0]?.full_name : actor?.full_name;
    auditTrail.push({
      id: `hist-${row.id}`,
      kind: "status_change",
      action: row.to_status as string,
      notes: row.notes,
      actor_name: actorName ?? null,
      created_at: row.created_at as string,
      order_id: row.order_id,
      order_number: orderNumberById.get(row.order_id) ?? null,
    });
  }

  auditTrail.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const balanceDue = ordersWithSummary.reduce((sum, o) => sum + o.balance, 0);
  const activeOrders = ordersWithSummary.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  ).length;

  return {
    profile: profile as Profile,
    batches,
    orders: ordersWithSummary,
    payments: (payments ?? []) as Payment[],
    auditTrail: auditTrail.slice(0, 80),
    stats: {
      totalOrders: ordersWithSummary.length,
      activeOrders,
      totalPaid,
      balanceDue,
    },
  };
}
