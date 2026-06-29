"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PermissionError,
  requireRole,
} from "@/lib/auth/guards";
import { logActivity } from "@/server/actions/notifications";
import { validateExcelBase64 } from "@/lib/upload/validate";
import type { Batch, BatchStatus, ProductType, Profile } from "@/types/database";

export type ExcelImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

export type BatchTrackingRow = {
  id: string;
  full_name: string;
  payment_status: "paid" | "partial" | "unpaid";
  design_status: string;
  order_status: string | null;
  order_id: string | null;
  order_number: string | null;
  has_account: boolean;
};

export type BatchTrackingSummary = {
  rows: BatchTrackingRow[];
  stats: {
    total: number;
    paid: number;
    partial: number;
    unpaid: number;
    withAccount: number;
    delivered: number;
  };
};

export type RepresentativeDashboardStats = {
  batchCount: number;
  totalStudents: number;
  confirmedStudents: number;
  accountsCreated: number;
  activeOrders: number;
  unpaidStudents: number;
};

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const batchSchema = z.object({
  name: z.string().min(1),
  college: z.preprocess(emptyToUndefined, z.string().optional()),
  department: z.preprocess(emptyToUndefined, z.string().optional()),
  graduation_year: z.coerce.number().optional(),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
  representative_id: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
});

const studentSchema = z.object({
  batch_id: z.string().uuid(),
  full_name: z.string().min(1),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  size: z.preprocess(emptyToUndefined, z.string().optional()),
  sash_color: z.preprocess(emptyToUndefined, z.string().optional()),
  cap_type: z.preprocess(emptyToUndefined, z.string().optional()),
  custom_text: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

const studentAccountSchema = z.object({
  batch_student_id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(6),
});

async function getBatchOrThrow(batchId: string): Promise<Batch> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: batch, error } = await supabase
    .from("batches")
    .select("*")
    .eq("id", batchId)
    .single();

  if (error || !batch) throw new Error("Batch not found");
  return batch as Batch;
}

async function assertCanManageBatch(batch: Batch, profile: Profile) {
  if (profile.role === "admin") return;

  if (profile.role === "representative") {
    if (batch.representative_id !== profile.id) {
      throw new PermissionError("You can only manage your own batches");
    }
    return;
  }

  throw new PermissionError("Insufficient role");
}

export async function getBatches() {
  const profile = await requireRole(["admin", "representative"]);
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase.from("batches").select("*").order("created_at", { ascending: false });

  if (profile.role === "representative") {
    query = query.eq("representative_id", profile.id);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getBatchById(batchId: string) {
  const profile = await requireRole(["admin", "representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);
  return batch;
}

export async function createBatch(input: z.infer<typeof batchSchema>) {
  await requireRole(["admin"]);
  const data = batchSchema.parse(input);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  if (!data.representative_id) {
    throw new Error("Select a representative for this batch");
  }

  const { data: batch, error } = await supabase
    .from("batches")
    .insert({
      name: data.name,
      college: data.college,
      department: data.department,
      graduation_year: data.graduation_year,
      notes: data.notes,
      representative_id: data.representative_id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/representative/batches");
  revalidatePath("/admin/batches");
  return batch;
}

export async function getBatchStudents(batchId: string) {
  const profile = await requireRole(["admin", "representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("batch_students")
    .select("*")
    .eq("batch_id", batchId)
    .order("full_name");

  return data ?? [];
}

export async function addBatchStudent(input: z.infer<typeof studentSchema>) {
  const profile = await requireRole(["admin", "representative"]);
  const data = studentSchema.parse(input);
  const batch = await getBatchOrThrow(data.batch_id);
  await assertCanManageBatch(batch, profile);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: student, error } = await supabase
    .from("batch_students")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/representative/batches/${data.batch_id}`);
  revalidatePath(`/admin/batches/${data.batch_id}`);
  return student;
}

export async function createBatchStudentAccount(
  input: z.infer<typeof studentAccountSchema>
) {
  const profile = await requireRole(["representative"]);
  const data = studentAccountSchema.parse(input);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: batchStudent, error: studentError } = await supabase
    .from("batch_students")
    .select("*, batches(*)")
    .eq("id", data.batch_student_id)
    .single();

  if (studentError || !batchStudent) {
    throw new Error("Student not found in batch");
  }

  if (batchStudent.student_id) {
    throw new Error("This student already has a login account");
  }

  const batch = batchStudent.batches as Batch;
  await assertCanManageBatch(batch, profile);

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin credentials are required to create accounts");
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: batchStudent.full_name },
  });

  if (authError) {
    if (
      authError.message.includes("already been registered") ||
      authError.message.includes("already exists")
    ) {
      throw new Error("This email is already registered");
    }
    throw new Error(authError.message || "Failed to create account");
  }

  const userId = authData.user?.id;
  if (!userId) throw new Error("Account was not created");

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      role: "student",
      full_name: batchStudent.full_name,
      phone: batchStudent.phone,
      college: batch.college,
      department: batch.department,
      graduation_year: batch.graduation_year,
      is_active: true,
      locale: "ar",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(profileError.message || "Failed to save student profile");
  }

  const { error: linkError } = await supabase
    .from("batch_students")
    .update({ student_id: userId })
    .eq("id", data.batch_student_id);

  if (linkError) {
    throw new Error(linkError.message || "Failed to link student account");
  }

  try {
    await logActivity(profile.id, "create_student_account", "profile", userId, {
      batch_id: batch.id,
      batch_student_id: data.batch_student_id,
    });
  } catch {
    // non-blocking
  }

  revalidatePath(`/representative/batches/${batch.id}`);
  revalidatePath(`/admin/batches/${batch.id}`);
  return { id: userId, email: data.email };
}

export async function removeBatchStudent(studentId: string, batchId: string) {
  const profile = await requireRole(["admin", "representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: student } = await supabase
    .from("batch_students")
    .select("confirmed, student_id")
    .eq("id", studentId)
    .single();

  if (student?.confirmed) throw new Error("Cannot remove confirmed student");
  if (student?.student_id) {
    throw new Error("Cannot remove a student who already has a login account");
  }

  await supabase.from("batch_students").delete().eq("id", studentId);
  revalidatePath(`/representative/batches/${batchId}`);
  revalidatePath(`/admin/batches/${batchId}`);
  return { success: true };
}

export async function downloadBatchImportTemplate() {
  await requireRole(["admin", "representative"]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Students");
  sheet.columns = [
    { header: "Full Name", key: "full_name", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Size", key: "size", width: 10 },
    { header: "Sash Color", key: "sash_color", width: 14 },
    { header: "Cap Type", key: "cap_type", width: 14 },
    { header: "Custom Text", key: "custom_text", width: 24 },
  ];
  sheet.addRow({
    full_name: "Ahmed Ali",
    phone: "07701234567",
    size: "M",
    sash_color: "Gold",
    cap_type: "Standard",
    custom_text: "Computer Science 2026",
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function importStudentsFromExcel(
  batchId: string,
  base64File: string
): Promise<ExcelImportResult> {
  const profile = await requireRole(["admin", "representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);

  const excelCheck = validateExcelBase64(base64File);
  if (!excelCheck.ok) {
    return { imported: 0, skipped: 0, errors: [{ row: 0, message: excelCheck.error }] };
  }

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: existingRows } = await supabase
    .from("batch_students")
    .select("full_name, phone")
    .eq("batch_id", batchId);

  const existingNames = new Set(
    (existingRows ?? []).map((row) => row.full_name.trim().toLowerCase())
  );
  const existingPhones = new Set(
    (existingRows ?? [])
      .map((row) => row.phone?.trim())
      .filter((phone): phone is string => Boolean(phone))
  );

  const buffer = Buffer.from(base64File, "base64");
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  await workbook.xlsx.load(arrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Excel file has no worksheets");

  const students: z.infer<typeof studentSchema>[] = [];
  const errors: ExcelImportResult["errors"] = [];
  let skipped = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const fullName = row.getCell(1).text?.trim();
    if (!fullName) {
      skipped += 1;
      return;
    }

    const phone = row.getCell(2).text?.trim() || undefined;
    const normalizedName = fullName.toLowerCase();

    if (existingNames.has(normalizedName)) {
      skipped += 1;
      errors.push({ row: rowNumber, message: "Duplicate name in batch" });
      return;
    }
    if (phone && existingPhones.has(phone)) {
      skipped += 1;
      errors.push({ row: rowNumber, message: "Duplicate phone in batch" });
      return;
    }

    const parsed = studentSchema.safeParse({
      batch_id: batchId,
      full_name: fullName,
      phone,
      size: row.getCell(3).text?.trim() || undefined,
      sash_color: row.getCell(4).text?.trim() || undefined,
      cap_type: row.getCell(5).text?.trim() || undefined,
      custom_text: row.getCell(6).text?.trim() || undefined,
    });

    if (!parsed.success) {
      skipped += 1;
      errors.push({ row: rowNumber, message: "Invalid row data" });
      return;
    }

    existingNames.add(normalizedName);
    if (phone) existingPhones.add(phone);
    students.push(parsed.data);
  });

  if (students.length === 0) {
    return { imported: 0, skipped, errors };
  }

  const { error } = await supabase.from("batch_students").insert(students);
  if (error) throw new Error(error.message);

  revalidatePath(`/representative/batches/${batchId}`);
  revalidatePath(`/admin/batches/${batchId}`);
  return { imported: students.length, skipped, errors };
}

export async function confirmBatch(batchId: string) {
  const profile = await requireRole(["admin", "representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  await supabase
    .from("batches")
    .update({ status: "confirmed" as BatchStatus })
    .eq("id", batchId);

  await supabase
    .from("batch_students")
    .update({ confirmed: true })
    .eq("batch_id", batchId);

  revalidatePath(`/representative/batches/${batchId}`);
  revalidatePath(`/admin/batches/${batchId}`);
  return { success: true };
}

export async function createGroupOrder(batchId: string, productTypes: ProductType[]) {
  const profile = await requireRole(["representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);

  if (!productTypes.length) throw new Error("Select at least one product");

  const { createOrder, getPriceForProduct } = await import("@/server/actions/orders");

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("batch_id", batchId)
    .eq("type", "group")
    .neq("status", "cancelled")
    .maybeSingle();

  if (existingOrder) {
    throw new Error("A group order already exists for this batch");
  }

  const { data: students } = await supabase
    .from("batch_students")
    .select("*")
    .eq("batch_id", batchId)
    .eq("confirmed", true);

  if (!students?.length) throw new Error("No confirmed students");

  const priceMap = Object.fromEntries(
    await Promise.all(
      productTypes.map(async (pt) => [pt, await getPriceForProduct(pt)] as const)
    )
  ) as Record<ProductType, number>;

  const items = students.flatMap((student) =>
    productTypes.map((productType) => ({
      product_type: productType,
      size: student.size ?? undefined,
      sash_color: student.sash_color ?? undefined,
      cap_type: student.cap_type ?? undefined,
      custom_text: student.custom_text ?? undefined,
      special_notes: student.full_name,
      unit_price: priceMap[productType],
    }))
  );

  const order = await createOrder({
    type: "group",
    batch_id: batchId,
    items,
    notes: `Group order for ${batch.name} (${students.length} students)`,
  });

  await supabase
    .from("batch_students")
    .update({ order_id: order.id })
    .eq("batch_id", batchId)
    .eq("confirmed", true);

  revalidatePath("/representative/orders");
  revalidatePath(`/representative/batches/${batchId}`);
  revalidatePath("/representative/tracking");
  return order;
}

function resolvePaymentStatus(
  paid: number,
  total: number
): "paid" | "partial" | "unpaid" {
  if (total <= 0) return "unpaid";
  if (paid >= total) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
}

export async function getBatchTrackingSummary(
  batchId: string
): Promise<BatchTrackingSummary | null> {
  const profile = await requireRole(["admin", "representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);

  const supabase = await createClient();
  if (!supabase) return null;

  const { data: students } = await supabase
    .from("batch_students")
    .select("*")
    .eq("batch_id", batchId)
    .order("full_name");

  const { data: batchOrders } = await supabase
    .from("orders")
    .select("id, order_number, status, total")
    .eq("batch_id", batchId)
    .neq("status", "cancelled");

  const orderIds = (batchOrders ?? []).map((order) => order.id);
  const orderMap = new Map((batchOrders ?? []).map((order) => [order.id, order]));

  const paymentsByOrder = new Map<string, number>();
  const designByOrder = new Map<string, string>();

  if (orderIds.length > 0) {
    const [{ data: payments }, { data: designs }] = await Promise.all([
      supabase.from("payments").select("order_id, amount").in("order_id", orderIds),
      supabase
        .from("design_submissions")
        .select("order_id, status")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false }),
    ]);

    for (const payment of payments ?? []) {
      paymentsByOrder.set(
        payment.order_id,
        (paymentsByOrder.get(payment.order_id) ?? 0) + Number(payment.amount)
      );
    }
    for (const design of designs ?? []) {
      if (!designByOrder.has(design.order_id)) {
        designByOrder.set(design.order_id, design.status);
      }
    }
  }

  const rows: BatchTrackingRow[] = (students ?? []).map((student) => {
    const orderId = student.order_id ?? batchOrders?.[0]?.id ?? null;
    const order = orderId ? orderMap.get(orderId) : null;
    const paid = orderId ? paymentsByOrder.get(orderId) ?? 0 : 0;
    const total = order ? Number(order.total) : 0;

    let designStatus = "no_account";
    if (student.student_id) {
      designStatus = orderId
        ? designByOrder.get(orderId) ?? "pending"
        : "pending";
    }

    return {
      id: student.id,
      full_name: student.full_name,
      payment_status: order
        ? resolvePaymentStatus(paid, total)
        : (student.payment_status as "paid" | "partial" | "unpaid"),
      design_status: designStatus,
      order_status: order?.status ?? null,
      order_id: orderId,
      order_number: order?.order_number ?? null,
      has_account: Boolean(student.student_id),
    };
  });

  const stats = {
    total: rows.length,
    paid: rows.filter((row) => row.payment_status === "paid").length,
    partial: rows.filter((row) => row.payment_status === "partial").length,
    unpaid: rows.filter((row) => row.payment_status === "unpaid").length,
    withAccount: rows.filter((row) => row.has_account).length,
    delivered: rows.filter((row) => row.order_status === "delivered").length,
  };

  return { rows, stats };
}

export async function getRepresentativeDashboardStats(): Promise<RepresentativeDashboardStats | null> {
  const profile = await requireRole(["representative"]);
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: batches } = await supabase
    .from("batches")
    .select("id")
    .eq("representative_id", profile.id);

  const batchIds = (batches ?? []).map((batch) => batch.id);

  const [{ data: students }, { data: orders }] = await Promise.all([
    batchIds.length > 0
      ? supabase
          .from("batch_students")
          .select("id, confirmed, student_id, payment_status")
          .in("batch_id", batchIds)
      : Promise.resolve({ data: [] as Array<{
          id: string;
          confirmed: boolean;
          student_id: string | null;
          payment_status: string;
        }> }),
    supabase
      .from("orders")
      .select("status")
      .eq("representative_id", profile.id)
      .eq("archived", false),
  ]);

  const studentRows = students ?? [];
  const activeOrders = (orders ?? []).filter(
    (order) => order.status !== "delivered" && order.status !== "cancelled"
  ).length;

  return {
    batchCount: batches?.length ?? 0,
    totalStudents: studentRows.length,
    confirmedStudents: studentRows.filter((student) => student.confirmed).length,
    accountsCreated: studentRows.filter((student) => student.student_id).length,
    activeOrders,
    unpaidStudents: studentRows.filter((student) => student.payment_status !== "paid").length,
  };
}
