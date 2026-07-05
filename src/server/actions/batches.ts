"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import {
  PermissionError,
  requireRole,
} from "@/lib/auth/guards";
import { logActivity } from "@/server/actions/notifications";
import { getBatchDefaultsSettings, getProductFieldPermissions } from "@/server/actions/settings";
import {
  buildBatchLockedSnapshot,
  buildStudentFieldsSnapshot,
} from "@/lib/orders/product-field-permissions";
import { suggestSizeFromGuide } from "@/lib/settings/size-guide";
import { getSizeGuideEntries } from "@/server/actions/settings";
import {
  applyBatchDefaultsToStudent,
  assertBatchFieldUpdatesAllowed,
  mergeBatchFieldPolicy,
} from "@/lib/batches/field-lock";
import {
  provisionBatchStudentAccount,
  regenerateBatchStudentCredentials as regenerateCredentials,
} from "@/lib/batches/provision-student";
import { deriveStudentPassword } from "@/lib/auth/access-code";
import { validateExcelBase64 } from "@/lib/upload/validate";
import type { Batch, BatchStatus, ProductType, Profile } from "@/types/database";
import type { BatchSettings } from "@/lib/settings/types";

export type ExcelImportResult = {
  imported: number;
  skipped: number;
  accountsCreated: number;
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
  fabric_type: z.preprocess(emptyToUndefined, z.string().optional()),
  font_family: z.preprocess(emptyToUndefined, z.string().optional()),
  custom_text: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
  height_cm: z.coerce.number().int().positive().optional(),
  weight_kg: z.coerce.number().int().positive().optional(),
});

const updateStudentSchema = studentSchema
  .omit({ batch_id: true })
  .partial()
  .extend({
    batch_id: z.string().uuid(),
    student_id: z.string().uuid(),
  });

const sizePolicySchema = z.object({
  product_type: z.enum(["sash", "cap", "gown", "suit", "custom"]),
  mode: z.enum([
    "one_size",
    "fixed_list",
    "estimate",
    "fixed_and_estimate",
    "custom",
    "fixed_and_custom",
  ]),
  one_size_label_ar: z.string(),
  one_size_label_en: z.string(),
  allow_estimate: z.boolean(),
  allow_custom_measurements: z.boolean(),
});

const batchSettingsSchema = z.object({
  batch_id: z.string().uuid(),
  settings: z.object({
    locked_fields: z.array(z.string()).optional(),
    editable_fields: z.array(z.string()).optional(),
    defaults: z.record(z.unknown()).optional(),
    size_policies: z
      .record(z.enum(["sash", "cap", "gown", "suit", "custom"]), sizePolicySchema)
      .optional()
      .nullable(),
  }),
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

async function getBatchFieldPolicyForBatch(batch: Batch) {
  const platformDefaults = await getBatchDefaultsSettings();
  return mergeBatchFieldPolicy(platformDefaults, (batch.settings ?? {}) as BatchSettings);
}

export async function getBatchFieldPolicy(batchId: string) {
  const profile = await requireRole(["admin", "representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);
  return getBatchFieldPolicyForBatch(batch);
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

export async function addBatchStudent(
  input: z.infer<typeof studentSchema> & { create_account?: boolean }
) {
  const profile = await requireRole(["admin", "representative"]);
  const { create_account, ...rest } = input;
  let data = studentSchema.parse(rest);
  const batch = await getBatchOrThrow(data.batch_id);
  await assertCanManageBatch(batch, profile);

  const policy = await getBatchFieldPolicyForBatch(batch);
  data = applyBatchDefaultsToStudent(policy, data) as typeof data;

  if (data.height_cm && data.weight_kg && !data.size) {
    const guide = await getSizeGuideEntries("gown");
    const suggested = suggestSizeFromGuide(guide, data.height_cm, data.weight_kg, "gown");
    if (suggested) data = { ...data, size: suggested.size_code };
  }

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: student, error } = await supabase
    .from("batch_students")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (create_account) {
    const account = await provisionBatchStudentAccount(student, batch);
    await supabase
      .from("batch_students")
      .update({ student_id: account.userId })
      .eq("id", student.id);
  }

  revalidatePath(`/representative/batches/${data.batch_id}`);
  revalidatePath(`/admin/batches/${data.batch_id}`);
  return student;
}

export async function updateBatchStudent(input: z.infer<typeof updateStudentSchema>) {
  const profile = await requireRole(["admin", "representative"]);
  const data = updateStudentSchema.parse(input);
  const batch = await getBatchOrThrow(data.batch_id);
  await assertCanManageBatch(batch, profile);

  const policy = await getBatchFieldPolicyForBatch(batch);
  const { batch_id, student_id, ...patch } = data;
  assertBatchFieldUpdatesAllowed(
    policy,
    patch,
    profile.role === "admin" ? "admin" : "representative"
  );

  if (patch.height_cm && patch.weight_kg && !patch.size) {
    const guide = await getSizeGuideEntries("gown");
    const suggested = suggestSizeFromGuide(
      guide,
      patch.height_cm,
      patch.weight_kg,
      "gown"
    );
    if (suggested) patch.size = suggested.size_code;
  }

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase
    .from("batch_students")
    .update(patch)
    .eq("id", student_id)
    .eq("batch_id", batch_id);

  if (error) throw new Error(error.message);

  revalidatePath(`/representative/batches/${batch_id}`);
  revalidatePath(`/admin/batches/${batch_id}`);
  return { success: true };
}

export async function updateBatchSettingsAction(input: z.infer<typeof batchSettingsSchema>) {
  const profile = await requireRole(["admin", "representative"]);
  const data = batchSettingsSchema.parse(input);
  const batch = await getBatchOrThrow(data.batch_id);
  await assertCanManageBatch(batch, profile);

  if (profile.role === "representative" && data.settings.locked_fields) {
    throw new PermissionError("Only admin can change locked batch fields");
  }

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const mergedSettings: BatchSettings = {
    ...((batch.settings ?? {}) as BatchSettings),
    ...data.settings,
  };

  if ("size_policies" in data.settings) {
    if (data.settings.size_policies == null) {
      delete mergedSettings.size_policies;
    } else {
      mergedSettings.size_policies = data.settings.size_policies;
    }
  }

  const { error } = await supabase
    .from("batches")
    .update({ settings: mergedSettings, updated_at: new Date().toISOString() })
    .eq("id", data.batch_id);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/batches/${data.batch_id}`);
  revalidatePath(`/representative/batches/${data.batch_id}`);
  return { success: true };
}

export async function createBatchStudentAccount(input: { batch_student_id: string }) {
  const profile = await requireRole(["admin", "representative"]);
  const batchStudentId = z.string().uuid().parse(input.batch_student_id);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: batchStudent, error: studentError } = await supabase
    .from("batch_students")
    .select("*, batches(*)")
    .eq("id", batchStudentId)
    .single();

  if (studentError || !batchStudent) {
    throw new Error("Student not found in batch");
  }

  const batch = batchStudent.batches as Batch;
  await assertCanManageBatch(batch, profile);

  const account = await provisionBatchStudentAccount(batchStudent, batch);

  const { error: linkError } = await supabase
    .from("batch_students")
    .update({ student_id: account.userId })
    .eq("id", batchStudentId);

  if (linkError) {
    throw new Error(linkError.message || "Failed to link student account");
  }

  try {
    await logActivity(profile.id, "create_student_account", "profile", account.userId, {
      batch_id: batch.id,
      batch_student_id: batchStudentId,
    });
  } catch {
    // non-blocking
  }

  revalidatePath(`/representative/batches/${batch.id}`);
  revalidatePath(`/admin/batches/${batch.id}`);
  return {
    id: account.userId,
    accessCode: account.accessCode,
    password: account.password,
  };
}

export async function regenerateBatchStudentCredentials(batchStudentId: string) {
  const profile = await requireRole(["admin", "representative"]);
  const id = z.string().uuid().parse(batchStudentId);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: batchStudent } = await supabase
    .from("batch_students")
    .select("*, batches(*)")
    .eq("id", id)
    .single();

  if (!batchStudent?.student_id) {
    throw new Error("Student has no account to regenerate");
  }

  const batch = batchStudent.batches as Batch;
  await assertCanManageBatch(batch, profile);

  const account = await regenerateCredentials(
    batchStudent.student_id,
    batchStudent,
    batch
  );

  try {
    await logActivity(profile.id, "regenerate_student_credentials", "profile", account.userId, {
      batch_id: batch.id,
      batch_student_id: id,
    });
  } catch {
    // non-blocking
  }

  revalidatePath(`/representative/batches/${batch.id}`);
  revalidatePath(`/admin/batches/${batch.id}`);
  return {
    accessCode: account.accessCode,
    password: account.password,
  };
}

export async function bulkCreateBatchAccounts(batchId: string) {
  const profile = await requireRole(["admin", "representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: students } = await supabase
    .from("batch_students")
    .select("*")
    .eq("batch_id", batchId)
    .is("student_id", null);

  let created = 0;
  for (const student of students ?? []) {
    const account = await provisionBatchStudentAccount(student, batch);
    await supabase
      .from("batch_students")
      .update({ student_id: account.userId })
      .eq("id", student.id);
    created += 1;
  }

  revalidatePath(`/representative/batches/${batchId}`);
  revalidatePath(`/admin/batches/${batchId}`);
  return { created };
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
    { header: "Height (cm)", key: "height_cm", width: 14 },
    { header: "Weight (kg)", key: "weight_kg", width: 14 },
  ];
  sheet.addRow({
    full_name: "Ahmed Ali",
    phone: "07701234567",
    height_cm: 175,
    weight_kg: 72,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const n = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function exportBatchCredentialsExcel(batchId: string) {
  const profile = await requireRole(["admin", "representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: students } = await supabase
    .from("batch_students")
    .select("full_name, phone, student_id")
    .eq("batch_id", batchId)
    .not("student_id", "is", null)
    .order("full_name");

  const userIds = (students ?? []).map((s) => s.student_id).filter(Boolean) as string[];
  const accessByUser = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, access_code")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      if (p.access_code) accessByUser.set(p.id, p.access_code);
    }
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Credentials");
  sheet.columns = [
    { header: "Student Name", key: "full_name", width: 28 },
    { header: "Username (Access Code)", key: "username", width: 22 },
    { header: "Password", key: "password", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
  ];

  for (const row of students ?? []) {
    const accessCode = row.student_id ? accessByUser.get(row.student_id) : null;
    if (!accessCode) continue;
    sheet.addRow({
      full_name: row.full_name,
      username: accessCode,
      password: deriveStudentPassword(accessCode),
      phone: row.phone ?? "",
    });
  }

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
  const policy = await getBatchFieldPolicyForBatch(batch);
  const sizeGuide = await getSizeGuideEntries("gown");

  const excelCheck = validateExcelBase64(base64File);
  if (!excelCheck.ok) {
    return {
      imported: 0,
      skipped: 0,
      accountsCreated: 0,
      errors: [{ row: 0, message: excelCheck.error }],
    };
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

  const pending: z.infer<typeof studentSchema>[] = [];
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
    const heightCm = parseOptionalInt(row.getCell(3).text?.trim());
    const weightKg = parseOptionalInt(row.getCell(4).text?.trim());
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

    let size: string | undefined;
    if (heightCm && weightKg) {
      const suggested = suggestSizeFromGuide(sizeGuide, heightCm, weightKg, "gown");
      size = suggested?.size_code;
    }

    const rowData = applyBatchDefaultsToStudent(policy, {
      batch_id: batchId,
      full_name: fullName,
      phone,
      height_cm: heightCm,
      weight_kg: weightKg,
      size,
    }) as z.infer<typeof studentSchema>;

    const parsed = studentSchema.safeParse(rowData);
    if (!parsed.success) {
      skipped += 1;
      errors.push({ row: rowNumber, message: "Invalid row data" });
      return;
    }

    existingNames.add(normalizedName);
    if (phone) existingPhones.add(phone);
    pending.push(parsed.data);
  });

  if (pending.length === 0) {
    return { imported: 0, skipped, accountsCreated: 0, errors };
  }

  let imported = 0;
  let accountsCreated = 0;

  for (const studentData of pending) {
    const { data: inserted, error } = await supabase
      .from("batch_students")
      .insert(studentData)
      .select()
      .single();

    if (error || !inserted) {
      skipped += 1;
      errors.push({ row: 0, message: error?.message ?? "Insert failed" });
      continue;
    }

    imported += 1;

    try {
      const account = await provisionBatchStudentAccount(inserted, batch);
      await supabase
        .from("batch_students")
        .update({ student_id: account.userId })
        .eq("id", inserted.id);
      accountsCreated += 1;
    } catch (err) {
      errors.push({
        row: 0,
        message:
          err instanceof Error
            ? `Account for ${studentData.full_name}: ${err.message}`
            : `Account for ${studentData.full_name} failed`,
      });
    }
  }

  revalidatePath(`/representative/batches/${batchId}`);
  revalidatePath(`/admin/batches/${batchId}`);
  return { imported, skipped, accountsCreated, errors };
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

export async function createGroupOrder(
  batchId: string,
  productTypes: ProductType[],
  options?: {
    notes?: string;
    referenceImageDataUrl?: string;
  }
) {
  const profile = await requireRole(["admin", "representative"]);
  const batch = await getBatchOrThrow(batchId);
  await assertCanManageBatch(batch, profile);

  if (!productTypes.length) throw new Error("Select at least one product");

  const { createOrder, getPriceForProduct } = await import("@/server/actions/orders");

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: existingOrders } = await supabase
    .from("batch_students")
    .select("id")
    .eq("batch_id", batchId)
    .not("order_id", "is", null)
    .limit(1);

  if (existingOrders?.length) {
    throw new Error("Group orders already exist for this batch");
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

  const permissionsMap = (await getProductFieldPermissions()) as Record<
    ProductType,
    import("@/lib/orders/product-field-permissions").ProductFieldPermissions
  >;

  const orderNotes = [
    `Group order for ${batch.name} (${students.length} students)`,
    options?.notes?.trim() || null,
  ];

  if (options?.referenceImageDataUrl) {
    const { uploadDataUrl } = await import("@/lib/supabase/storage");
    const path = `group-orders/${batchId}/${Date.now()}-reference.png`;
    const uploaded = await uploadDataUrl(
      supabase,
      "designs",
      path,
      options.referenceImageDataUrl,
      { upsert: true }
    );
    if (uploaded.publicUrl) {
      orderNotes.push(`مرجع تصميم / Design reference: ${uploaded.publicUrl}`);
    }
  }

  const notes = orderNotes.filter(Boolean).join("\n\n");
  let firstOrder: { id: string } | null = null;
  let createdCount = 0;

  for (const student of students) {
    const source = { ...student } as Record<string, unknown>;
    const items = productTypes.map((productType) => {
      const perms = permissionsMap[productType];
      const locked = buildBatchLockedSnapshot(productType, perms, source);
      const studentSnap = buildStudentFieldsSnapshot(productType, perms, source);

      return {
        product_type: productType,
        size: student.size ?? undefined,
        sash_color: (locked.sash_color as string) ?? student.sash_color ?? undefined,
        cap_type: (locked.cap_type as string) ?? student.cap_type ?? undefined,
        fabric_type: (locked.fabric_type as string) ?? student.fabric_type ?? undefined,
        font_family: (studentSnap.font_family as string) ?? student.font_family ?? undefined,
        custom_text: (studentSnap.custom_text as string) ?? student.custom_text ?? undefined,
        batch_locked_fields: locked,
        student_fields: studentSnap,
        unit_price: priceMap[productType],
      };
    });

    const order = await createOrder({
      type: "group",
      batch_id: batchId,
      student_id: student.student_id ?? undefined,
      items,
      notes,
    });

    await supabase
      .from("batch_students")
      .update({ order_id: order.id })
      .eq("id", student.id);

    if (!firstOrder) firstOrder = order;
    createdCount += 1;
  }

  revalidatePath("/representative/orders");
  revalidatePath("/admin/orders");
  revalidatePath(`/representative/batches/${batchId}`);
  revalidatePath(`/admin/batches/${batchId}`);
  revalidatePath("/representative/tracking");

  return { ...firstOrder!, created_count: createdCount, batch_id: batchId };
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
