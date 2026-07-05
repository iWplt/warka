import type { ProductType } from "@/types/database";

export type WarkaLayoutGuide = {
  title_ar: string;
  title_en: string;
  steps: { ar: string; en: string }[];
};

export const WARKA_LAYOUT_BY_TYPE: Partial<Record<ProductType, WarkaLayoutGuide>> = {
  sash: {
    title_ar: "ترتيب الوشاح (حسب مواصفات WARKA)",
    title_en: "Sash layout (WARKA spec)",
    steps: [
      {
        ar: "① اختر الشكل: أورجنال أمريكي / مثلث×مثلث / مثلث+مقوس / طلب خاص بصورة",
        en: "① Pick style: American original / triangle×triangle / triangle+curved / custom photo",
      },
      {
        ar: "② اليسار: الاختصاص + الاسم الثنائي أو الثلاثي",
        en: "② Left: major + dual/triple name",
      },
      {
        ar: "③ اليمين: إما سنة بالطول — أو قسم/جامعة + لوغو + Class of + سنة",
        en: "③ Right: vertical year OR dept/university + logo + Class of + year",
      },
      {
        ar: "④ الخلف: بعد تحديد الشكل — آية أو اقتباس (القياس mm يُحسب تلقائياً)",
        en: "④ Back: after shape — verse or quote (mm auto-calculated)",
      },
    ],
  },
  cap: {
    title_ar: "ترتيب القبعة",
    title_en: "Cap layout",
    steps: [
      {
        ar: "① الطوق الجانبي: الاسم + نقشة بسيطة (مثال: نور + فراشة)",
        en: "① Side band: name + small motif (e.g. Noor + butterfly)",
      },
      {
        ar: "② الأعلى: آية / اقتباس / لوغو / نقشة جاهزة",
        en: "② Top: verse / quote / logo / preset pattern",
      },
    ],
  },
  gown: {
    title_ar: "ترتيب الروب",
    title_en: "Gown layout",
    steps: [
      {
        ar: "① اختر الشكل: عادي / خليجي (كسرات كتف + ردن كلوش) / أمريكي / خاص بالدفعة",
        en: "① Style: plain / Gulf / American / batch-only",
      },
      {
        ar: "② إضافات اختيارية: فتحة ردن، تطعيم بزمة، ستان، خط إضافي، نقشة، إطار",
        en: "② Optional additions: yoke, cuff trim, satin, extra line, icon, frame",
      },
      {
        ar: "③ معظم الإضافات بلون الوشاح — الستان والنقشة قابلة لاختيار اللون",
        en: "③ Most additions match sash color — satin & icon are selectable",
      },
    ],
  },
};
