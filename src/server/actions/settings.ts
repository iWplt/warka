"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PermissionError, requireRole } from "@/lib/auth/guards";
import {
  DEFAULT_BATCH_DEFAULTS,
  DEFAULT_DEPOSIT_SETTINGS,
  type BatchDefaultsSettings,
  type BatchSettings,
  type DepositSettings,
  type EmbroideryPosition,
  type SizeGuideEntry,
} from "@/lib/settings/types";
import { parseDepositSettings } from "@/lib/settings/deposit";
import {
  DEFAULT_SIZE_POLICIES,
  parseSizePolicies,
  type ProductSizePolicy,
} from "@/lib/settings/size-policies";
import {
  DEFAULT_PAYMENT_METHOD_SETTINGS,
  parsePaymentMethodSettings,
  type PaymentMethodSettings,
} from "@/lib/payment/payment-method-settings";
import { IRAQI_PAYMENT_METHODS } from "@/lib/payment/iraqi-methods";
import type { ProductType } from "@/types/database";
import {
  DEFAULT_PRODUCT_FIELD_PERMISSIONS,
  type ProductFieldPermissions,
} from "@/lib/orders/product-field-permissions";

export async function getProductFieldPermissions(
  productType?: ProductType
): Promise<ProductFieldPermissions | Record<ProductType, ProductFieldPermissions>> {
  const supabase = await createClient();
  if (!supabase) {
    return productType
      ? DEFAULT_PRODUCT_FIELD_PERMISSIONS[productType]
      : DEFAULT_PRODUCT_FIELD_PERMISSIONS;
  }

  const { data } = await supabase.from("product_field_permissions").select("*");
  const map = { ...DEFAULT_PRODUCT_FIELD_PERMISSIONS };

  for (const row of data ?? []) {
    const pt = row.product_type as ProductType;
    if (!pt || !DEFAULT_PRODUCT_FIELD_PERMISSIONS[pt]) continue;
    map[pt] = {
      product_type: pt,
      batch_locked_fields: Array.isArray(row.batch_locked_fields)
        ? (row.batch_locked_fields as string[])
        : DEFAULT_PRODUCT_FIELD_PERMISSIONS[pt].batch_locked_fields,
      student_editable_fields: Array.isArray(row.student_editable_fields)
        ? (row.student_editable_fields as string[])
        : DEFAULT_PRODUCT_FIELD_PERMISSIONS[pt].student_editable_fields,
    };
  }

  return productType ? map[productType] : map;
}

function parseSizeGuideRow(row: Record<string, unknown>): SizeGuideEntry {
  return {
    id: row.id as string,
    product_type: (row.product_type as ProductType | null) ?? null,
    size_code: row.size_code as string,
    label_ar: row.label_ar as string,
    label_en: row.label_en as string,
    min_height_cm: row.min_height_cm != null ? Number(row.min_height_cm) : null,
    max_height_cm: row.max_height_cm != null ? Number(row.max_height_cm) : null,
    min_weight_kg: row.min_weight_kg != null ? Number(row.min_weight_kg) : null,
    max_weight_kg: row.max_weight_kg != null ? Number(row.max_weight_kg) : null,
    min_bmi: row.min_bmi != null ? Number(row.min_bmi) : null,
    max_bmi: row.max_bmi != null ? Number(row.max_bmi) : null,
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

async function readSetting<T>(key: string, fallback: T, parser: (v: unknown) => T): Promise<T> {
  const supabase = await createClient();
  if (!supabase) return fallback;

  const { data } = await supabase.from("platform_settings").select("value").eq("key", key).maybeSingle();
  if (!data?.value) return fallback;
  return parser(data.value);
}

export async function getDepositSettings(): Promise<DepositSettings> {
  return readSetting("deposit", DEFAULT_DEPOSIT_SETTINGS, parseDepositSettings);
}

export async function getPaymentMethodSettings(): Promise<PaymentMethodSettings> {
  return readSetting(
    "payment_methods",
    DEFAULT_PAYMENT_METHOD_SETTINGS,
    parsePaymentMethodSettings
  );
}

export async function getBatchDefaultsSettings(): Promise<BatchDefaultsSettings> {
  return readSetting("batch_defaults", DEFAULT_BATCH_DEFAULTS, (raw) => {
    if (!raw || typeof raw !== "object") return DEFAULT_BATCH_DEFAULTS;
    const v = raw as Record<string, unknown>;
    return {
      admin_locked_fields: Array.isArray(v.admin_locked_fields)
        ? (v.admin_locked_fields as string[])
        : DEFAULT_BATCH_DEFAULTS.admin_locked_fields,
      rep_editable_fields: Array.isArray(v.rep_editable_fields)
        ? (v.rep_editable_fields as string[])
        : DEFAULT_BATCH_DEFAULTS.rep_editable_fields,
    };
  });
}

export async function getSizeGuideEntries(productType?: ProductType): Promise<SizeGuideEntry[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("size_guide_entries")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (productType) {
    query = query.or(`product_type.eq.${productType},product_type.is.null`);
  }

  const { data } = await query;
  return (data ?? []).map((row) => parseSizeGuideRow(row as Record<string, unknown>));
}

export async function listAllSizeGuideEntries(): Promise<SizeGuideEntry[]> {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin.from("size_guide_entries").select("*").order("sort_order");
  return (data ?? []).map((row) => parseSizeGuideRow(row as Record<string, unknown>));
}

const depositSchema = z.object({
  mode: z.enum(["percentage", "fixed"]),
  percentage: z.coerce.number().min(0).max(100),
  fixed_amount: z.coerce.number().min(0),
  min_deposit_iqd: z.coerce.number().min(0),
});

export async function updateDepositSettings(input: z.infer<typeof depositSchema>) {
  await requireRole(["admin"]);
  const data = depositSchema.parse(input);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { error } = await admin.from("platform_settings").upsert({
    key: "deposit",
    value: data,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}

const paymentMethodConfigSchema = z.object({
  id: z.enum(["zain_cash", "super_qi", "fib", "asiapay", "cash"]),
  is_active: z.boolean(),
  phone: z.string().max(80).optional().default(""),
  account_number: z.string().max(120).optional().default(""),
  card_number: z.string().max(120).optional().default(""),
  notes: z.string().max(500).optional().default(""),
});

const paymentMethodsSchema = z.object({
  methods: z.array(paymentMethodConfigSchema).min(1),
});

export async function updatePaymentMethodSettings(
  input: z.infer<typeof paymentMethodsSchema>
) {
  await requireRole(["admin"]);
  const data = paymentMethodsSchema.parse(input);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const byId = new Map(data.methods.map((m) => [m.id, m]));
  const normalized: PaymentMethodSettings = {
    methods: IRAQI_PAYMENT_METHODS.map((id) => {
      const row = byId.get(id);
      return {
        id,
        is_active: row?.is_active ?? true,
        phone: (row?.phone ?? "").trim(),
        account_number: (row?.account_number ?? "").trim(),
        card_number: (row?.card_number ?? "").trim(),
        notes: (row?.notes ?? "").trim(),
      };
    }),
  };

  const { error } = await admin.from("platform_settings").upsert({
    key: "payment_methods",
    value: normalized,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/payment-methods");
  revalidatePath("/admin/payments");
  revalidatePath("/checkout");
}

const sizeGuideSchema = z.object({
  id: z.string().uuid().optional(),
  product_type: z.enum(["sash", "cap", "gown", "suit", "custom"]).nullable().optional(),
  size_code: z.string().min(1),
  label_ar: z.string().min(1),
  label_en: z.string().min(1),
  min_height_cm: z.coerce.number().int().nullable().optional(),
  max_height_cm: z.coerce.number().int().nullable().optional(),
  min_weight_kg: z.coerce.number().int().nullable().optional(),
  max_weight_kg: z.coerce.number().int().nullable().optional(),
  min_bmi: z.coerce.number().nullable().optional(),
  max_bmi: z.coerce.number().nullable().optional(),
  sort_order: z.coerce.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function upsertSizeGuideEntry(input: z.infer<typeof sizeGuideSchema>) {
  await requireRole(["admin"]);
  const data = sizeGuideSchema.parse(input);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const payload = {
    product_type: data.product_type ?? null,
    size_code: data.size_code,
    label_ar: data.label_ar,
    label_en: data.label_en,
    min_height_cm: data.min_height_cm ?? null,
    max_height_cm: data.max_height_cm ?? null,
    min_weight_kg: data.min_weight_kg ?? null,
    max_weight_kg: data.max_weight_kg ?? null,
    min_bmi: data.min_bmi ?? null,
    max_bmi: data.max_bmi ?? null,
    sort_order: data.sort_order ?? 0,
    is_active: data.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (data.id) {
    const { error } = await admin.from("size_guide_entries").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("size_guide_entries").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/settings");
}

export async function deleteSizeGuideEntry(id: string) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { error } = await admin.from("size_guide_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}

export async function updateProductEmbroideryPositions(
  productId: string,
  positions: EmbroideryPosition[]
) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const { error } = await admin
    .from("products")
    .update({
      embroidery_positions: positions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

export async function updateBatchSettings(batchId: string, settings: BatchSettings) {
  const profile = await requireRole(["admin", "representative"]);

  // User-scoped client so RLS (batches_rep) applies as defense in depth —
  // never use the service-role client here.
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: batch, error: fetchError } = await supabase
    .from("batches")
    .select("id, representative_id, settings")
    .eq("id", batchId)
    .single();

  if (fetchError || !batch) {
    throw new PermissionError("Batch not found or access denied");
  }

  if (
    profile.role === "representative" &&
    batch.representative_id !== profile.id
  ) {
    throw new PermissionError("You can only manage your own batches");
  }

  if (profile.role === "representative" && settings.locked_fields) {
    throw new PermissionError("Only admin can change locked batch fields");
  }

  const { error } = await supabase
    .from("batches")
    .update({
      settings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/batches");
  revalidatePath(`/admin/batches/${batchId}`);
  revalidatePath(`/representative/batches/${batchId}`);
}

export async function getSizePolicies(): Promise<Record<ProductType, ProductSizePolicy>> {
  return readSetting("size_policies", DEFAULT_SIZE_POLICIES, parseSizePolicies);
}

export type StudentSizePolicyContext = {
  policies: Record<ProductType, ProductSizePolicy>;
  isBatchStudent: boolean;
  batchId: string | null;
  batchName: string | null;
  representativeId: string | null;
  /** Roster size from batch import — locked when batch locks the size field. */
  rosterSize: string | null;
};

/** Resolves size policies for the logged-in student (batch overrides when linked to a batch). */
export async function getSizePoliciesForStudent(): Promise<StudentSizePolicyContext> {
  const { getCurrentProfile } = await import("@/lib/auth/guards");
  const { getStudentBatchMembership, batchSettingsFromMembership } = await import(
    "@/lib/batches/student-membership"
  );
  const { resolveSizePoliciesForContext } = await import("@/lib/settings/resolve-size-policies");

  const profile = await getCurrentProfile();
  const globalPolicies = await getSizePolicies();

  if (!profile || profile.role !== "student") {
    return {
      policies: globalPolicies,
      isBatchStudent: false,
      batchId: null,
      batchName: null,
      representativeId: null,
      rosterSize: null,
    };
  }

  const membership = await getStudentBatchMembership(profile.id);
  if (!membership) {
    return {
      policies: globalPolicies,
      isBatchStudent: false,
      batchId: null,
      batchName: null,
      representativeId: null,
      rosterSize: null,
    };
  }

  const batchSettings = batchSettingsFromMembership(membership);
  return {
    policies: resolveSizePoliciesForContext({
      globalPolicies,
      batchSettings,
      isBatchStudent: true,
    }),
    isBatchStudent: true,
    batchId: membership.batch.id,
    batchName: membership.batch.name,
    representativeId: membership.batch.representative_id,
    rosterSize: membership.roster.size ?? null,
  };
}

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
  one_size_label_ar: z.string().min(1),
  one_size_label_en: z.string().min(1),
  allow_estimate: z.boolean(),
  allow_custom_measurements: z.boolean(),
});

export async function updateSizePolicies(
  policies: z.infer<typeof sizePolicySchema>[]
) {
  await requireRole(["admin"]);
  const parsed = policies.map((p) => sizePolicySchema.parse(p));
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase not configured");

  const value = Object.fromEntries(parsed.map((p) => [p.product_type, p]));

  const { error } = await admin.from("platform_settings").upsert({
    key: "size_policies",
    value,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}
