export type ContentType =
  | "name_major"
  | "university_info"
  | "text_library"
  | "pattern_icon"
  | "custom_image";

export type OptionType =
  | "preset_pattern"
  | "preset_text"
  | "logo_upload"
  | "custom_text"
  | "custom_image";

export type ColorSource = "selectable" | "match_sash_color" | "fixed";

export type ProductStyle = {
  id: string;
  product_id: string;
  style_key: string;
  style_name_ar: string;
  style_name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  preview_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  is_batch_locked: boolean;
};

export type CustomizationZone = {
  id: string;
  product_id: string;
  style_id: string | null;
  zone_key: string;
  zone_label_ar: string;
  zone_label_en: string | null;
  content_type: ContentType;
  allows_multiple: boolean;
  max_chars: number | null;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
};

export type ZoneContentOption = {
  id: string;
  zone_id: string;
  option_key: string | null;
  option_name_ar: string;
  option_name_en: string | null;
  option_type: OptionType;
  preview_image_url: string | null;
  default_text: string | null;
  sort_order: number;
  is_active: boolean;
};

export type TextLibraryEntry = {
  id: string;
  category: string;
  content_ar: string;
  content_en: string | null;
  is_active: boolean;
  sort_order: number;
};

export type EmbroiderySizeRule = {
  id: string;
  zone_id: string;
  min_chars: number;
  max_chars: number;
  embroidery_size_mm: number;
  sort_order: number;
};

export type EmbroideryColor = {
  id: string;
  color_name_ar: string;
  color_name_en: string | null;
  hex_code: string | null;
  thread_reference_code: string | null;
  is_active: boolean;
  sort_order: number;
};

export type ZoneColorOption = {
  id: string;
  zone_id: string;
  color_id: string | null;
  color_source: ColorSource;
  fixed_hex: string | null;
  sort_order: number;
};

export type GownAddition = {
  id: string;
  product_id: string;
  style_id: string | null;
  addition_key: string;
  addition_name_ar: string;
  addition_name_en: string | null;
  color_source: ColorSource;
  is_optional: boolean;
  sort_order: number;
  is_active: boolean;
};

export type ZoneSelection = {
  zone_id: string;
  zone_key: string;
  zone_label_ar?: string;
  content_type: ContentType;
  style_id?: string | null;
  text_value?: string;
  text_library_id?: string;
  option_id?: string;
  option_type?: OptionType;
  image_data_url?: string;
  color_id?: string | null;
  color_hex?: string | null;
  color_source?: ColorSource;
  computed_size_mm?: number;
};

export type CustomizationPayload = {
  style_id: string | null;
  style_key?: string;
  style_name_ar?: string;
  zones: ZoneSelection[];
  gown_additions?: string[];
};

export type ProductCustomizationProfile = {
  product_id: string;
  styles: ProductStyle[];
  zones: CustomizationZone[];
  options: ZoneContentOption[];
  size_rules: EmbroiderySizeRule[];
  zone_colors: ZoneColorOption[];
  gown_additions: GownAddition[];
  text_library: TextLibraryEntry[];
  embroidery_colors: EmbroideryColor[];
};
