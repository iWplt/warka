import type { ProductType } from "@/types/database";
import type { ProductSizePolicy } from "@/lib/settings/size-policies";

export type DepositSettings = {
  mode: "percentage" | "fixed";
  percentage: number;
  fixed_amount: number;
  min_deposit_iqd: number;
};

export type BatchDefaultsSettings = {
  admin_locked_fields: string[];
  rep_editable_fields: string[];
};

export type SizeGuideEntry = {
  id: string;
  product_type: ProductType | null;
  size_code: string;
  label_ar: string;
  label_en: string;
  min_height_cm: number | null;
  max_height_cm: number | null;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
  min_bmi: number | null;
  max_bmi: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EmbroideryPosition = {
  key: string;
  label_ar: string;
  label_en: string;
  sort_order: number;
  is_active: boolean;
};

export type BatchSettings = {
  deposit?: Partial<DepositSettings>;
  /** Per-product size rules for students in this batch (overrides open defaults). */
  size_policies?: Partial<Record<ProductType, ProductSizePolicy>>;
  locked_fields?: string[];
  editable_fields?: string[];
  defaults?: Record<string, unknown>;
};

export type WarkaFont = {
  id: string;
  name_ar: string;
  name_en: string | null;
  font_family_css: string;
  file_url: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_DEPOSIT_SETTINGS: DepositSettings = {
  mode: "percentage",
  percentage: 30,
  fixed_amount: 0,
  min_deposit_iqd: 0,
};

export const DEFAULT_BATCH_DEFAULTS: BatchDefaultsSettings = {
  admin_locked_fields: ["sash_color", "fabric_type", "logo_url", "embroidery_style"],
  rep_editable_fields: ["size", "custom_text", "font_family", "measurements"],
};
