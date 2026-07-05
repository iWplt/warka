import {
  DEFAULT_BATCH_DEFAULTS,
  type BatchDefaultsSettings,
  type BatchSettings,
} from "@/lib/settings/types";

export type BatchFieldPolicy = {
  lockedFields: Set<string>;
  editableFields: Set<string>;
  defaults: Record<string, unknown>;
};

const ALL_ROSTER_FIELDS = [
  "size",
  "sash_color",
  "cap_type",
  "fabric_type",
  "custom_text",
  "font_family",
  "height_cm",
  "weight_kg",
  "full_name",
  "phone",
  "notes",
] as const;

export function mergeBatchFieldPolicy(
  platformDefaults: BatchDefaultsSettings,
  batchSettings: BatchSettings | null | undefined
): BatchFieldPolicy {
  const lockedFields = new Set(
    batchSettings?.locked_fields?.length
      ? batchSettings.locked_fields
      : platformDefaults.admin_locked_fields
  );
  const editableFields = new Set(
    batchSettings?.editable_fields?.length
      ? batchSettings.editable_fields
      : platformDefaults.rep_editable_fields
  );

  return {
    lockedFields,
    editableFields,
    defaults: batchSettings?.defaults ?? {},
  };
}

export function assertBatchFieldUpdatesAllowed(
  policy: BatchFieldPolicy,
  patch: Record<string, unknown>,
  role: "admin" | "representative"
): void {
  if (role === "admin") return;

  for (const key of Object.keys(patch)) {
    if (!ALL_ROSTER_FIELDS.includes(key as (typeof ALL_ROSTER_FIELDS)[number])) continue;
    if (policy.lockedFields.has(key)) {
      throw new Error(`Field "${key}" is locked for this batch — contact admin to change it`);
    }
  }
}

export function applyBatchDefaultsToStudent<T extends Record<string, unknown>>(
  policy: BatchFieldPolicy,
  student: T
): T {
  const next = { ...student };
  for (const [key, value] of Object.entries(policy.defaults)) {
    if (value == null || value === "") continue;
    if (next[key] == null || next[key] === "") {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

export { DEFAULT_BATCH_DEFAULTS };
