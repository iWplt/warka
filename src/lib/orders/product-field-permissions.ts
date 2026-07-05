import type { ProductType } from "@/types/database";

export type ProductFieldPermissions = {
  product_type: ProductType;
  batch_locked_fields: string[];
  student_editable_fields: string[];
};

/** Default matrix from spec — overridden by DB table when present */
export const DEFAULT_PRODUCT_FIELD_PERMISSIONS: Record<ProductType, ProductFieldPermissions> = {
  cap: {
    product_type: "cap",
    batch_locked_fields: ["sash_color", "fabric_type", "cap_type", "logo_url", "size"],
    student_editable_fields: [
      "cap_side_notes",
      "cap_top_notes",
      "embroidery_position",
      "embroidery_style",
      "embroidery_image_path",
      "cap_side_embroidery_path",
      "cap_top_embroidery_path",
      "customization_payload",
    ],
  },
  sash: {
    product_type: "sash",
    batch_locked_fields: ["sash_color", "fabric_type", "size"],
    student_editable_fields: [
      "custom_text",
      "font_family",
      "embroidery_position",
      "embroidery_style",
      "thread_color",
      "back_shape",
      "embroidery_image_path",
      "customization_payload",
    ],
  },
  gown: {
    product_type: "gown",
    batch_locked_fields: ["sash_color", "fabric_type", "logo_url"],
    student_editable_fields: [
      "size",
      "custom_measurements",
      "custom_text",
      "font_family",
      "special_notes",
      "embroidery_position",
      "embroidery_style",
      "thread_color",
      "embroidery_image_path",
      "customization_payload",
    ],
  },
  suit: {
    product_type: "suit",
    batch_locked_fields: ["sash_color", "fabric_type", "logo_url"],
    student_editable_fields: [
      "size",
      "custom_measurements",
      "custom_text",
      "font_family",
      "special_notes",
      "embroidery_position",
      "embroidery_style",
      "thread_color",
      "embroidery_image_path",
      "customization_payload",
    ],
  },
  custom: {
    product_type: "custom",
    batch_locked_fields: ["sash_color", "fabric_type"],
    student_editable_fields: [
      "size",
      "custom_measurements",
      "custom_text",
      "font_family",
      "special_notes",
      "embroidery_position",
      "embroidery_style",
      "thread_color",
      "embroidery_image_path",
      "customization_payload",
    ],
  },
};

export type OrderItemFieldSnapshot = Record<string, string | null | undefined>;

export function compactStringRecord(snapshot: OrderItemFieldSnapshot): Record<string, string> {
  return Object.fromEntries(
    Object.entries(snapshot).flatMap(([key, value]) =>
      value != null && value !== "" ? [[key, value]] : []
    )
  );
}

const COLUMN_TO_ITEM: Record<string, (item: Record<string, unknown>) => unknown> = {
  sash_color: (i) => i.sash_color,
  fabric_type: (i) => i.fabric_type,
  cap_type: (i) => i.cap_type,
  logo_url: (i) => i.logo_url,
  size: (i) => i.size,
  custom_text: (i) => i.custom_text,
  font_family: (i) => i.font_family,
  embroidery_position: (i) => i.embroidery_position,
  embroidery_style: (i) => i.embroidery_style,
  thread_color: (i) => i.thread_color,
  back_shape: (i) => i.back_shape,
  cap_side_notes: (i) => i.cap_side_notes,
  cap_top_notes: (i) => i.cap_top_notes,
  special_notes: (i) => i.special_notes,
  custom_measurements: (i) => {
    const sf = (i.student_fields ?? {}) as Record<string, unknown>;
    return sf.custom_measurements ?? null;
  },
  embroidery_image_path: (i) => i.embroidery_image_path,
  cap_side_embroidery_path: (i) => i.cap_side_embroidery_path,
  cap_top_embroidery_path: (i) => i.cap_top_embroidery_path,
};

export function readItemField(item: Record<string, unknown>, field: string): unknown {
  const studentFields = (item.student_fields ?? {}) as Record<string, unknown>;
  if (field in studentFields && studentFields[field] != null && studentFields[field] !== "") {
    return studentFields[field];
  }
  const reader = COLUMN_TO_ITEM[field];
  return reader ? reader(item) : item[field];
}

export function buildBatchLockedSnapshot(
  productType: ProductType,
  permissions: ProductFieldPermissions,
  source: Record<string, unknown>
): OrderItemFieldSnapshot {
  const locked: OrderItemFieldSnapshot = {};
  for (const field of permissions.batch_locked_fields) {
    const value = COLUMN_TO_ITEM[field]?.(source) ?? source[field];
    if (value != null && value !== "") {
      locked[field] = String(value);
    }
  }
  return locked;
}

export function buildStudentFieldsSnapshot(
  productType: ProductType,
  permissions: ProductFieldPermissions,
  source: Record<string, unknown>
): OrderItemFieldSnapshot {
  const student: OrderItemFieldSnapshot = {};
  for (const field of permissions.student_editable_fields) {
    const value = COLUMN_TO_ITEM[field]?.(source) ?? source[field];
    if (value != null && value !== "") {
      student[field] = String(value);
    }
  }
  return student;
}

export function isFieldLockedForBatchOrder(
  orderBatchId: string | null | undefined,
  field: string,
  permissions: ProductFieldPermissions
): boolean {
  if (!orderBatchId) return false;
  return permissions.batch_locked_fields.includes(field);
}

export function assertStudentFieldUpdatesAllowed(
  order: { batch_id: string | null },
  productType: ProductType,
  permissions: ProductFieldPermissions,
  patch: Record<string, unknown>
): void {
  for (const key of Object.keys(patch)) {
    if (!permissions.student_editable_fields.includes(key)) {
      throw new Error(`Field "${key}" is not editable by students for this product`);
    }
    if (order.batch_id && permissions.batch_locked_fields.includes(key)) {
      throw new Error(`Field "${key}" is locked by the batch representative`);
    }
  }
}

export const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  sash_color: { ar: "اللون", en: "Color" },
  fabric_type: { ar: "نوع القماش", en: "Fabric" },
  cap_type: { ar: "نوع القبعة", en: "Cap type" },
  logo_url: { ar: "الشعار الأساسي", en: "Base logo" },
  size: { ar: "المقاس", en: "Size" },
  custom_text: { ar: "الاسم / النص", en: "Name / text" },
  font_family: { ar: "خط التطريز", en: "Font" },
  embroidery_position: { ar: "موضع التطريز", en: "Embroidery position" },
  embroidery_style: { ar: "نوع الزخرفة", en: "Decoration style" },
  thread_color: { ar: "لون الخيط", en: "Thread color" },
  back_shape: { ar: "شكل الظهر", en: "Back shape" },
  cap_side_notes: { ar: "تطريز جانب القبعة", en: "Cap side embroidery" },
  cap_top_notes: { ar: "تطريز أعلى القبعة", en: "Cap top embroidery" },
  special_notes: { ar: "ملاحظات", en: "Notes" },
  custom_measurements: { ar: "قياسات مخصصة", en: "Custom measurements" },
  embroidery_image_path: { ar: "صورة الزخرفة", en: "Decoration image" },
  cap_side_embroidery_path: { ar: "مرجع جانب القبعة", en: "Cap side reference" },
  cap_top_embroidery_path: { ar: "مرجع أعلى القبعة", en: "Cap top reference" },
};
