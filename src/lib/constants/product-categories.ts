import type { ProductType } from "@/types/database";

export type ProductCategoryMeta = {
  slug: string;
  productType: ProductType;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  imageGuidelinesAr: string;
  imageGuidelinesEn: string;
};

export const PRODUCT_CATEGORY_META: ProductCategoryMeta[] = [
  {
    slug: "sash",
    productType: "sash",
    nameAr: "الأوشحة",
    nameEn: "Sashes",
    sortOrder: 1,
    imageGuidelinesAr:
      "يُفضّل صورة مربعة أو عمودية. أي قياس مقبول — يمكنك القص والتعديل بعد الرفع. الحد الأقصى 15 ميجابايت.",
    imageGuidelinesEn:
      "Square or portrait works best. Any size accepted — crop and resize after upload. Max 15 MB.",
  },
  {
    slug: "cap",
    productType: "cap",
    nameAr: "القبعات",
    nameEn: "Caps",
    sortOrder: 2,
    imageGuidelinesAr:
      "صورة واضحة للقبعة على خلفية محايدة. الأبعاد المرنة — استخدم أداة القص لضبط الإطار.",
    imageGuidelinesEn:
      "Clear cap photo on a neutral background. Flexible dimensions — use the crop tool to frame.",
  },
  {
    slug: "gown",
    productType: "gown",
    nameAr: "الأروبة",
    nameEn: "Gowns",
    sortOrder: 3,
    imageGuidelinesAr:
      "يُفضّل صورة كاملة للروب. جميع الأحجام والقياسات مقبولة مع إمكانية القص.",
    imageGuidelinesEn:
      "Full gown photo preferred. All sizes and dimensions accepted with cropping.",
  },
  {
    slug: "suit",
    productType: "suit",
    nameAr: "البدلات",
    nameEn: "Suits",
    sortOrder: 4,
    imageGuidelinesAr:
      "صورة البدلة كاملة أو تفصيلية. يمكن رفع PNG/JPEG/WebP/GIF بأي أبعاد.",
    imageGuidelinesEn:
      "Full or detail suit photo. PNG/JPEG/WebP/GIF at any dimensions.",
  },
  {
    slug: "custom",
    productType: "custom",
    nameAr: "تصاميم مخصصة",
    nameEn: "Custom",
    sortOrder: 5,
    imageGuidelinesAr:
      "ارفع صورة مرجعية للتصميم المطلوب. القص اختياري — الملف يُحفظ بجودة مناسبة للعرض.",
    imageGuidelinesEn:
      "Upload a reference image. Cropping is optional — file is saved at display quality.",
  },
];

export function getCategoryMeta(slugOrType: string) {
  return PRODUCT_CATEGORY_META.find(
    (c) => c.slug === slugOrType || c.productType === slugOrType
  );
}
