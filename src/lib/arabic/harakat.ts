export type DiacriticsMode = "manual" | "auto";

/** Arabic combining marks for manual entry */
export const HARAKAT_BUTTONS = [
  { char: "\u064E", label: "فَتحة", en: "Fatha" },
  { char: "\u0650", label: "كَسرة", en: "Kasra" },
  { char: "\u064F", label: "ضَمّة", en: "Damma" },
  { char: "\u0652", label: "سُكون", en: "Sukun" },
  { char: "\u0651", label: "شَدّة", en: "Shadda" },
  { char: "\u064B", label: "تنوين فتح", en: "Tanwin Fath" },
  { char: "\u064D", label: "تنوين كسر", en: "Tanwin Kasr" },
  { char: "\u064C", label: "تنوين ضم", en: "Tanwin Damm" },
] as const;

const TASHKEEL_RE = /[\u064B-\u065F\u0670\u0640]/g;

export function stripTashkeel(text: string): string {
  return text.replace(TASHKEEL_RE, "").replace(/\u0640/g, "");
}

const WORD_TASHKEEL: Record<string, string> = {
  علي: "عَلِيّ",
  محمد: "مُحَمَّد",
  احمد: "أَحْمَد",
  أحمد: "أَحْمَد",
  حسن: "حَسَن",
  حسين: "حُسَيْن",
  فاطمة: "فَاطِمَة",
  زهراء: "زَهْرَاء",
  عباس: "عَبَّاس",
  عبد: "عَبْد",
  الله: "الله",
  العباس: "الْعَبَّاس",
  عبدالله: "عَبْدُ الله",
  "عبد الله": "عَبْدُ الله",
  "عبد العباس": "عَبْدُ الْعَبَّاس",
  "علي عبد": "عَلِيّ عَبْد",
  "علي عبدالعباس": "عَلِيّ عَبْدُ الْعَبَّاس",
  "علي عبد العباس": "عَلِيّ عَبْدُ الْعَبَّاس",
  كاظم: "كَاظِم",
  مصطفى: "مُصْطَفَى",
  مريم: "مَرْيَم",
  سارة: "سَارَة",
  نور: "نُور",
  زينب: "زَيْنَب",
  رقية: "رُقَيَّة",
  عمر: "عُمَر",
  خالد: "خَالِد",
  يوسف: "يُوسُف",
  إبراهيم: "إِبْرَاهِيم",
  ابراهيم: "إِبْرَاهِيم",
  داود: "دَاوُد",
  سجاد: "سَجَّاد",
  كرار: "كَرَّار",
  مرتضى: "مُرْتَضَى",
  مرتضي: "مُرْتَضَى",
  زين: "زَيْن",
  العِراق: "الْعِرَاق",
  العراق: "الْعِرَاق",
};

function normalizeWord(word: string): string {
  return stripTashkeel(word).replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").trim();
}

function tashkeelWord(word: string): string {
  const raw = stripTashkeel(word);
  if (WORD_TASHKEEL[raw]) return WORD_TASHKEEL[raw];
  const normalized = normalizeWord(word);
  if (WORD_TASHKEEL[normalized]) return WORD_TASHKEEL[normalized];
  if (raw.startsWith("ال") && WORD_TASHKEEL[raw.slice(2)]) {
    return `ال${WORD_TASHKEEL[raw.slice(2)]}`;
  }
  return raw;
}

/** Best-effort tashkeel for graduation names (dictionary + per-word fallback). */
export function suggestTashkeelForName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";

  const full = WORD_TASHKEEL[stripTashkeel(trimmed)] ?? WORD_TASHKEEL[trimmed];
  if (full) return full;

  return trimmed
    .split(/\s+/)
    .map((word) => tashkeelWord(word))
    .join(" ");
}

export function resolveEmbroideryDisplayName(
  baseName: string,
  mode: DiacriticsMode
): string {
  const trimmed = baseName.trim();
  if (!trimmed) return "";
  if (mode === "manual") return trimmed;
  return suggestTashkeelForName(trimmed);
}

export function insertHarakatAtCursor(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  haraka: string
): { value: string; cursor: number } {
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const next = `${before}${haraka}${after}`;
  const cursor = selectionStart + haraka.length;
  return { value: next, cursor };
}
