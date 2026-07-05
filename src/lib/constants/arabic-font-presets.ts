import type { WarkaFont } from "@/lib/settings/types";

/** Famous Arabic calligraphy styles — loaded via Google Fonts (free for web). */
export type ArabicFontPreset = {
  name_ar: string;
  name_en: string;
  font_family_css: string;
  file_url: string;
  category: string;
};

export const ARABIC_FONT_PRESETS: ArabicFontPreset[] = [
  {
    name_ar: "ديوان ثلث",
    name_en: "Diwan Thuluth",
    font_family_css: "Katibeh",
    file_url: "google://Katibeh",
    category: "thuluth",
  },
  {
    name_ar: "ديوان نسخ",
    name_en: "Diwan Naskh",
    font_family_css: "Amiri",
    file_url: "google://Amiri:ital,wght@0,400;0,700;1,400",
    category: "naskh",
  },
  {
    name_ar: "مصحفي الذهبي",
    name_en: "Mushaf Gold",
    font_family_css: "Scheherazade New",
    file_url: "google://Scheherazade+New:wght@400;700",
    category: "naskh",
  },
  {
    name_ar: "مصحفي الفضي",
    name_en: "Mushaf Silver",
    font_family_css: "Noto Naskh Arabic",
    file_url: "google://Noto+Naskh+Arabic:wght@400;700",
    category: "naskh",
  },
  {
    name_ar: "ديوان فارسي",
    name_en: "Diwan Persian",
    font_family_css: "Noto Nastaliq Urdu",
    file_url: "google://Noto+Nastaliq+Urdu:wght@400;700",
    category: "nastaliq",
  },
  {
    name_ar: "ديواني",
    name_en: "Diwani",
    font_family_css: "Rakkas",
    file_url: "google://Rakkas",
    category: "diwani",
  },
  {
    name_ar: "وسيم",
    name_en: "Waseem",
    font_family_css: "Markazi Text",
    file_url: "google://Markazi+Text:wght@400;700",
    category: "display",
  },
  {
    name_ar: "وسيم رفيع",
    name_en: "Waseem Thin",
    font_family_css: "Lateef",
    file_url: "google://Lateef:wght@400;700",
    category: "display",
  },
  {
    name_ar: "دمشق",
    name_en: "Damascus",
    font_family_css: "Mirza",
    file_url: "google://Mirza:wght@400;700",
    category: "calligraphy",
  },
  {
    name_ar: "دمشق عريض",
    name_en: "Damascus Bold",
    font_family_css: "Jomhuria",
    file_url: "google://Jomhuria",
    category: "calligraphy",
  },
  {
    name_ar: "كوفي",
    name_en: "Kufi",
    font_family_css: "Reem Kufi",
    file_url: "google://Reem+Kufi:wght@400;700",
    category: "kufi",
  },
  {
    name_ar: "كوفي قياسي",
    name_en: "Standard Kufi",
    font_family_css: "Kufam",
    file_url: "google://Kufam:wght@400;700",
    category: "kufi",
  },
  {
    name_ar: "بغداد",
    name_en: "Baghdad",
    font_family_css: "Lalezar",
    file_url: "google://Lalezar",
    category: "display",
  },
  {
    name_ar: "بيروت",
    name_en: "Beirut",
    font_family_css: "Aref Ruqaa",
    file_url: "google://Aref+Ruqaa",
    category: "ruqaa",
  },
  {
    name_ar: "رقعة حبر",
    name_en: "Ruqaa Ink",
    font_family_css: "Aref Ruqaa Ink",
    file_url: "google://Aref+Ruqaa+Ink",
    category: "ruqaa",
  },
  {
    name_ar: "بسمة",
    name_en: "Basma",
    font_family_css: "Harmattan",
    file_url: "google://Harmattan:wght@400;700",
    category: "naskh",
  },
  {
    name_ar: "صنعاء",
    name_en: "Sanaa",
    font_family_css: "El Messiri",
    file_url: "google://El+Messiri:wght@400;700",
    category: "display",
  },
  {
    name_ar: "عرب تايمز",
    name_en: "Arab Times",
    font_family_css: "Noto Sans Arabic",
    file_url: "google://Noto+Sans+Arabic:wght@400;700",
    category: "naskh",
  },
  {
    name_ar: "الجزائر",
    name_en: "Algeria",
    font_family_css: "Cairo",
    file_url: "google://Cairo:wght@400;700",
    category: "display",
  },
  {
    name_ar: "فرح",
    name_en: "Farah",
    font_family_css: "Tajawal",
    file_url: "google://Tajawal:wght@400;700",
    category: "display",
  },
];

export function presetsToWarkaFonts(): WarkaFont[] {
  const now = new Date().toISOString();
  return ARABIC_FONT_PRESETS.map((preset, index) => ({
    id: `preset-${preset.font_family_css.replace(/\s+/g, "-").toLowerCase()}`,
    name_ar: preset.name_ar,
    name_en: preset.name_en,
    font_family_css: preset.font_family_css,
    file_url: preset.file_url,
    category: preset.category,
    sort_order: index,
    is_active: true,
    created_at: now,
    updated_at: now,
  }));
}

export function fontDisplayName(font: WarkaFont, locale: "ar" | "en"): string {
  return locale === "ar" ? font.name_ar : font.name_en || font.name_ar;
}

export function findFontByFamily(fonts: WarkaFont[], family: string | null | undefined): WarkaFont | undefined {
  if (!family) return undefined;
  return fonts.find((f) => f.font_family_css === family);
}

export function isGoogleFontUrl(fileUrl: string): boolean {
  return fileUrl.startsWith("google://");
}

export function googleFontsStylesheetUrl(fileUrl: string): string | null {
  if (!isGoogleFontUrl(fileUrl)) return null;
  const query = fileUrl.slice("google://".length);
  return `https://fonts.googleapis.com/css2?family=${query}&display=swap&subset=arabic,latin`;
}
