import type { ProductType } from "@/types/database";
import {
  DEFAULT_PRODUCT_FIELD_PERMISSIONS,
  FIELD_LABELS,
  type ProductFieldPermissions,
} from "@/lib/orders/product-field-permissions";

export const EMBROIDERY_EDITABLE_FIELDS = [
  "custom_text",
  "font_family",
  "embroidery_position",
  "embroidery_style",
  "thread_color",
  "back_shape",
  "cap_side_notes",
  "cap_top_notes",
  "embroidery_image_path",
  "cap_side_embroidery_path",
  "cap_top_embroidery_path",
] as const;

const CAP_ONLY = new Set([
  "cap_side_notes",
  "cap_top_notes",
  "cap_side_embroidery_path",
  "cap_top_embroidery_path",
]);

const NO_CAP = new Set(["custom_text", "font_family", "thread_color", "back_shape"]);

export const EMBROIDERY_CONTEXT_FIELDS = [
  "size",
  "custom_measurements",
  "special_notes",
  "sash_color",
  "fabric_type",
  "logo_url",
  "cap_type",
] as const;

export function embroideryFieldsForProduct(productType: ProductType): string[] {
  return EMBROIDERY_EDITABLE_FIELDS.filter((key) => {
    if (CAP_ONLY.has(key)) return productType === "cap";
    if (productType === "cap" && NO_CAP.has(key)) return false;
    if (key === "back_shape" && productType === "cap") return false;
    return true;
  });
}

export function embroideryPermissionsForProduct(
  productType: ProductType
): ProductFieldPermissions {
  const base = DEFAULT_PRODUCT_FIELD_PERMISSIONS[productType];
  return {
    product_type: productType,
    batch_locked_fields: base.batch_locked_fields,
    student_editable_fields: embroideryFieldsForProduct(productType),
  };
}

export function assertEmbroideryFieldUpdatesAllowed(
  productType: ProductType,
  batchLocked: Record<string, string>,
  patch: Record<string, unknown>
): void {
  const allowed = new Set(embroideryFieldsForProduct(productType));
  for (const key of Object.keys(patch)) {
    if (!allowed.has(key)) {
      throw new Error(`Field "${key}" is not editable by embroidery staff`);
    }
    if (
      key in batchLocked ||
      DEFAULT_PRODUCT_FIELD_PERMISSIONS[productType].batch_locked_fields.includes(key)
    ) {
      throw new Error(`Field "${key}" is locked for this order item`);
    }
  }
}

export function buildEmbroideryContextDisplay(
  productType: ProductType,
  item: Record<string, unknown>,
  batchLocked: Record<string, string>
): { key: string; labelAr: string; labelEn: string; value: string }[] {
  const studentFields = (item.student_fields ?? {}) as Record<string, string>;
  const rows: { key: string; labelAr: string; labelEn: string; value: string }[] = [];

  for (const key of DEFAULT_PRODUCT_FIELD_PERMISSIONS[productType].batch_locked_fields) {
    const value = batchLocked[key] ?? String(item[key] ?? "");
    if (!value) continue;
    const labels = FIELD_LABELS[key] ?? { ar: key, en: key };
    rows.push({ key, labelAr: labels.ar, labelEn: labels.en, value });
  }

  for (const key of EMBROIDERY_CONTEXT_FIELDS) {
    if (DEFAULT_PRODUCT_FIELD_PERMISSIONS[productType].batch_locked_fields.includes(key)) continue;
    const value = String(studentFields[key] ?? item[key] ?? "").trim();
    if (!value) continue;
    const labels = FIELD_LABELS[key] ?? { ar: key, en: key };
    rows.push({ key, labelAr: labels.ar, labelEn: labels.en, value });
  }

  return rows;
}
