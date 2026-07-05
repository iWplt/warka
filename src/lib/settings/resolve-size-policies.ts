import type { ProductType } from "@/types/database";
import type { BatchSettings } from "@/lib/settings/types";
import {
  OPEN_SIZE_POLICIES,
  parseSizePolicies,
  type ProductSizePolicy,
} from "@/lib/settings/size-policies";

const PRODUCT_TYPES: ProductType[] = ["sash", "cap", "gown", "suit", "custom"];

export function parseBatchSizePolicies(
  raw: unknown
): Partial<Record<ProductType, ProductSizePolicy>> {
  if (!raw || typeof raw !== "object") return {};
  const parsed = parseSizePolicies(raw as Record<string, unknown>);
  const out: Partial<Record<ProductType, ProductSizePolicy>> = {};
  for (const pt of PRODUCT_TYPES) {
    if ((raw as Record<string, unknown>)[pt]) {
      out[pt] = parsed[pt];
    }
  }
  return out;
}

export function resolveSizePoliciesForContext(options: {
  /** Platform-wide policies from admin settings (fallback). */
  globalPolicies?: Record<ProductType, ProductSizePolicy>;
  /** Batch settings when student belongs to a graduation batch. */
  batchSettings?: BatchSettings | null;
  isBatchStudent: boolean;
}): Record<ProductType, ProductSizePolicy> {
  const base = options.isBatchStudent
    ? { ...OPEN_SIZE_POLICIES }
    : { ...(options.globalPolicies ?? OPEN_SIZE_POLICIES) };

  if (!options.isBatchStudent) return base;

  const overrides = options.batchSettings?.size_policies;
  if (!overrides) return base;

  const merged = { ...base };
  for (const pt of PRODUCT_TYPES) {
    const override = overrides[pt];
    if (!override) continue;
    merged[pt] = {
      ...merged[pt],
      ...override,
      product_type: pt,
    };
  }
  return merged;
}

export { PRODUCT_TYPES };
