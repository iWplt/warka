import type { ContentType, OptionType } from "@/types/customization";

export const CONTENT_TYPE_KEYS: ContentType[] = [
  "name_major",
  "university_info",
  "text_library",
  "pattern_icon",
  "custom_image",
];

export const OPTION_TYPE_KEYS: OptionType[] = [
  "preset_pattern",
  "preset_text",
  "logo_upload",
  "custom_text",
  "custom_image",
];

export const TEXT_CATEGORY_KEYS = ["quran_verse", "quote", "saying"] as const;

export const PRODUCT_TYPE_KEYS = ["sash", "cap", "gown", "suit", "custom"] as const;
