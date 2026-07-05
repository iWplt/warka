import type { ProductType } from "@/types/database";

/** How students pick a size for each product type */
export type ProductSizeMode =
  | "one_size"
  | "fixed_list"
  | "estimate"
  | "fixed_and_estimate"
  | "custom"
  | "fixed_and_custom";

export type ProductSizePolicy = {
  product_type: ProductType;
  mode: ProductSizeMode;
  /** Label when mode is one_size */
  one_size_label_ar: string;
  one_size_label_en: string;
  /** Height/weight size guide (قياسات التخمين) */
  allow_estimate: boolean;
  /** Free-text custom measurements from student */
  allow_custom_measurements: boolean;
};

/** Fully open policies for regular students and special (non-batch) orders. */
export const OPEN_SIZE_POLICIES: Record<ProductType, ProductSizePolicy> = {
  sash: {
    product_type: "sash",
    mode: "fixed_and_estimate",
    one_size_label_ar: "—",
    one_size_label_en: "—",
    allow_estimate: true,
    allow_custom_measurements: true,
  },
  cap: {
    product_type: "cap",
    mode: "fixed_and_estimate",
    one_size_label_ar: "—",
    one_size_label_en: "—",
    allow_estimate: true,
    allow_custom_measurements: true,
  },
  gown: {
    product_type: "gown",
    mode: "fixed_and_estimate",
    one_size_label_ar: "—",
    one_size_label_en: "—",
    allow_estimate: true,
    allow_custom_measurements: true,
  },
  suit: {
    product_type: "suit",
    mode: "fixed_and_estimate",
    one_size_label_ar: "—",
    one_size_label_en: "—",
    allow_estimate: true,
    allow_custom_measurements: true,
  },
  custom: {
    product_type: "custom",
    mode: "fixed_and_custom",
    one_size_label_ar: "—",
    one_size_label_en: "—",
    allow_estimate: true,
    allow_custom_measurements: true,
  },
};

/** Default platform policies — fully open for regular / special orders. */
export const DEFAULT_SIZE_POLICIES: Record<ProductType, ProductSizePolicy> = OPEN_SIZE_POLICIES;

export function parseSizePolicies(raw: unknown): Record<ProductType, ProductSizePolicy> {
  const base = { ...DEFAULT_SIZE_POLICIES };
  if (!raw || typeof raw !== "object") return base;

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const pt = key as ProductType;
    if (!base[pt] || !value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    base[pt] = {
      ...base[pt],
      mode: (v.mode as ProductSizeMode) ?? base[pt].mode,
      one_size_label_ar: String(v.one_size_label_ar ?? base[pt].one_size_label_ar),
      one_size_label_en: String(v.one_size_label_en ?? base[pt].one_size_label_en),
      allow_estimate: Boolean(v.allow_estimate ?? base[pt].allow_estimate),
      allow_custom_measurements: Boolean(
        v.allow_custom_measurements ?? base[pt].allow_custom_measurements
      ),
    };
  }
  return base;
}

export function getSizePolicy(
  policies: Record<ProductType, ProductSizePolicy>,
  productType: ProductType
): ProductSizePolicy {
  return policies[productType] ?? DEFAULT_SIZE_POLICIES[productType];
}

export function oneSizeLabel(policy: ProductSizePolicy, locale: "ar" | "en"): string {
  return locale === "ar" ? policy.one_size_label_ar : policy.one_size_label_en;
}

export function isOneSizeProduct(policy: ProductSizePolicy): boolean {
  return policy.mode === "one_size";
}

export function showsFixedSizeList(policy: ProductSizePolicy): boolean {
  return (
    policy.mode === "fixed_list" ||
    policy.mode === "fixed_and_estimate" ||
    policy.mode === "fixed_and_custom"
  );
}

export function showsSizeEstimate(policy: ProductSizePolicy): boolean {
  return (
    policy.allow_estimate &&
    (policy.mode === "estimate" || policy.mode === "fixed_and_estimate")
  );
}

export function showsCustomMeasurements(policy: ProductSizePolicy): boolean {
  return (
    policy.allow_custom_measurements &&
    (policy.mode === "custom" ||
      policy.mode === "fixed_and_custom" ||
      policy.mode === "fixed_and_estimate")
  );
}

export function sizeSelectionRequired(
  policy: ProductSizePolicy,
  size: string,
  customMeasurements: string
): boolean {
  if (policy.mode === "one_size") return false;
  if (policy.mode === "custom") return customMeasurements.trim().length > 0;
  if (showsFixedSizeList(policy) && size.trim().length > 0) return false;
  if (showsCustomMeasurements(policy) && customMeasurements.trim().length > 0) return false;
  return true;
}

export function resolveEffectiveSize(
  policy: ProductSizePolicy,
  locale: "ar" | "en",
  size: string,
  customMeasurements: string
): string {
  if (policy.mode === "one_size") return oneSizeLabel(policy, locale);
  if (size.trim()) return size.trim();
  if (customMeasurements.trim()) {
    return locale === "ar" ? "قياس مخصص" : "Custom measurements";
  }
  return "";
}
