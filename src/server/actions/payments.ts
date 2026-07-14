"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getCurrentProfile, requireAuth, requireRole } from "@/lib/auth/guards";
import {
  createNotificationInternal as createNotification,
  logActivityInternal as logActivity,
  notifyAdminsAndEmployees,
} from "@/lib/notifications/internal";
import type { PaymentStatus } from "@/types/database";

const paymentSchema = z.object({
  order_id: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(["cash", "bank_transfer", "zain_cash"]),
  notes: z.string().optional(),
});

export async function recordPayment(input: z.infer<typeof paymentSchema>) {
  const profile = await requireAuth();
  if (profile.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const data = paymentSchema.parse(input);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase
    .from("orders")
    .select("total, order_number, student_id, representative_id")
    .eq("id", data.order_id)
    .single();

  if (!order) throw new Error("Order not found");

  const { data: existingPayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("order_id", data.order_id);

  const paidSoFar =
    (existingPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0) +
    data.amount;

  let paymentStatus: PaymentStatus = "partial";
  if (paidSoFar >= Number(order.total)) paymentStatus = "paid";
  else if (paidSoFar === 0) paymentStatus = "unpaid";

  const { error } = await supabase.from("payments").insert({
    ...data,
    payment_status: paymentStatus,
    recorded_by: profile.id,
  });

  if (error) throw new Error(error.message);

  await notifyAdminsAndEmployees(
    "payment_received",
    `Payment received: ${order.order_number}`,
    `${data.amount} via ${data.method}`,
    "payments:view",
    `/admin/payments`,
    "order",
    data.order_id
  );

  const notifyUserId = order.student_id ?? order.representative_id;
  if (notifyUserId) {
    await createNotification(
      notifyUserId,
      "payment_received",
      `Payment received: ${order.order_number}`,
      `${data.amount}`,
      order.student_id
        ? `/student/orders/${data.order_id}`
        : `/representative/orders/${data.order_id}`
    );
  }

  await logActivity(profile.id, "record_payment", "order", data.order_id, data);
  revalidatePath("/admin/payments");
  revalidatePath(`/admin/orders/${data.order_id}`);
  return { paymentStatus, paidSoFar };
}

/** Admin confirms the student's deposit receipt — locks the order and marks deposit paid. */
export async function approveOrderDeposit(orderId: string) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, student_id, deposit_required, deposit_paid_at, total")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("Order not found");
  if (order.deposit_paid_at) {
    return { alreadyPaid: true as const };
  }

  const { data: pending } = await supabase
    .from("payments")
    .select("id, amount, notes")
    .eq("order_id", orderId)
    .eq("payment_status", "unpaid")
    .ilike("notes", "%Deposit%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const amount = Number(pending?.amount ?? order.deposit_required ?? 0);
  const paidStatus: PaymentStatus =
    amount >= Number(order.total) ? "paid" : amount > 0 ? "partial" : "unpaid";

  if (pending?.id) {
    await supabase
      .from("payments")
      .update({
        payment_status: paidStatus,
        notes: `${pending.notes ?? "Deposit"} | approved_by:${profile.id}`,
      })
      .eq("id", pending.id);
  } else if (amount > 0) {
    await supabase.from("payments").insert({
      order_id: orderId,
      amount,
      method: "cash",
      payment_status: paidStatus,
      recorded_by: profile.id,
      notes: "Deposit (arabon) — admin approved",
    });
  }

  await supabase
    .from("orders")
    .update({
      deposit_paid_at: new Date().toISOString(),
      is_locked: true,
      status: "pending_review",
    })
    .eq("id", orderId);

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    from_status: "pending_review",
    to_status: "pending_review",
    changed_by: profile.id,
    notes: "Deposit approved by admin — order locked",
  });

  if (order.student_id) {
    await createNotification(
      order.student_id,
      "payment_received",
      `Deposit approved: ${order.order_number}`,
      String(amount),
      `/student/orders/${orderId}`
    );
  }

  await logActivity(profile.id, "approve_deposit", "order", orderId, { amount });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  return { ok: true as const };
}

export async function getPayments(orderId?: string) {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("payments")
    .select("*, orders(order_number, total)")
    .order("created_at", { ascending: false });

  if (orderId) query = query.eq("order_id", orderId);

  const { data } = await query;
  return data ?? [];
}

export async function getUnpaidOrders() {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("*, payments(amount)")
    .eq("archived", false)
    .neq("status", "cancelled");

  return (orders ?? []).filter((order) => {
    const paid = (order.payments as { amount: number }[]).reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    return paid < Number(order.total);
  });
}

export async function updatePriceCatalog(
  id: string,
  updates: { base_price?: number; label?: string; active?: boolean }
) {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  await supabase.from("price_catalog").update(updates).eq("id", id);
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function getPriceCatalog() {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data } = await supabase.from("price_catalog").select("*").order("product_type");
  return data ?? [];
}
