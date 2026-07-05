export const IRAQI_UNIVERSITIES = [
  "جامعة بغداد",
  "الجامعة المستنصرية",
  "جامعة النهرين",
  "جامعة الكوفة",
  "جامعة البصرة",
  "جامعة الموصل",
  "جامعة النجف",
  "جامعة كربلاء",
  "جامعة بابل",
  "جامعة ديالى",
  "جامعة واسط",
  "جامعة ميسان",
  "جامعة ذي قار",
  "جامعة المثنى",
  "جامعة القادسية",
  "جامعة الأنبار",
  "جامعة سامراء",
  "جامعة تكريت",
  "جامعة صلاح الدين",
  "جامعة دهوك",
  "جامعة أربيل",
  "جامعة السليمانية",
  "الجامعة الأمريكية في العراق - Sulaimani",
  "جامعة Koya",
] as const;

export const IRAQI_GOVERNORATES = [
  { ar: "بغداد", en: "Baghdad", daysMin: 2, daysMax: 4 },
  { ar: "البصرة", en: "Basra", daysMin: 4, daysMax: 6 },
  { ar: "نينوى", en: "Nineveh", daysMin: 4, daysMax: 7 },
  { ar: "أربيل", en: "Erbil", daysMin: 3, daysMax: 5 },
  { ar: "النجف", en: "Najaf", daysMin: 3, daysMax: 5 },
  { ar: "كربلاء", en: "Karbala", daysMin: 3, daysMax: 5 },
  { ar: "السليمانية", en: "Sulaymaniyah", daysMin: 4, daysMax: 6 },
  { ar: "دهوك", en: "Duhok", daysMin: 4, daysMax: 6 },
  { ar: "الأنبار", en: "Anbar", daysMin: 5, daysMax: 7 },
  { ar: "ديالى", en: "Diyala", daysMin: 3, daysMax: 5 },
  { ar: "كركوك", en: "Kirkuk", daysMin: 4, daysMax: 6 },
  { ar: "بابل", en: "Babylon", daysMin: 3, daysMax: 5 },
  { ar: "واسط", en: "Wasit", daysMin: 4, daysMax: 6 },
  { ar: "ذي قار", en: "Dhi Qar", daysMin: 4, daysMax: 6 },
  { ar: "ميسان", en: "Maysan", daysMin: 4, daysMax: 6 },
  { ar: "المثنى", en: "Muthanna", daysMin: 5, daysMax: 7 },
  { ar: "القادسية", en: "Qadisiyyah", daysMin: 3, daysMax: 5 },
  { ar: "صلاح الدين", en: "Saladin", daysMin: 4, daysMax: 6 },
] as const;

/** Approximate map centers for delivery location picker */
export const GOVERNORATE_COORDS: Record<
  (typeof IRAQI_GOVERNORATES)[number]["en"],
  { lat: number; lng: number }
> = {
  Baghdad: { lat: 33.3152, lng: 44.3661 },
  Basra: { lat: 30.5085, lng: 47.7804 },
  Nineveh: { lat: 36.3489, lng: 43.1575 },
  Erbil: { lat: 36.1911, lng: 44.0092 },
  Najaf: { lat: 32.0104, lng: 44.3485 },
  Karbala: { lat: 32.616, lng: 44.0249 },
  Sulaymaniyah: { lat: 35.5558, lng: 45.4351 },
  Duhok: { lat: 36.8667, lng: 42.9833 },
  Anbar: { lat: 33.4206, lng: 43.3072 },
  Diyala: { lat: 33.7731, lng: 45.1495 },
  Kirkuk: { lat: 35.4681, lng: 44.3922 },
  Babylon: { lat: 32.4637, lng: 44.4196 },
  Wasit: { lat: 32.5128, lng: 45.8182 },
  "Dhi Qar": { lat: 31.0456, lng: 46.2572 },
  Maysan: { lat: 31.8356, lng: 47.1448 },
  Muthanna: { lat: 31.3167, lng: 45.3 },
  Qadisiyyah: { lat: 31.9889, lng: 44.925 },
  Saladin: { lat: 34.5978, lng: 43.6789 },
};

export const COD_FEE_IQD = 5000;

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "9647700000000";

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
