import type {
  Product,
  ProductColorVariant,
  ProductFabricOption,
  ProductType,
} from "@/types/database";

export const DEFAULT_COLOR_HEX: Record<string, string> = {
  أسود: "#1a1a1a",
  بيج: "#c4a882",
  زيتوني: "#556b2f",
  كريمي: "#f5f0e6",
};

export const DEFAULT_COLOR_LABELS = ["أسود", "بيج", "زيتوني", "كريمي"] as const;

export const DEFAULT_FABRIC_OPTIONS: ProductFabricOption[] = [
  {
    key: "standard",
    label_ar: "قماش عادي",
    label_en: "Standard",
    price_adjustment: 0,
    description_ar: "خامة جيدة مناسبة للاستخدام اليومي",
    description_en: "Quality fabric for everyday graduation wear",
  },
  {
    key: "premium",
    label_ar: "قماش فاخر",
    label_en: "Premium",
    price_adjustment: 15000,
    description_ar: "خامة فاخرة عالية الجودة بلمسة أنيقة",
    description_en: "Luxury high-grade fabric with a refined finish",
  },
];

export function colorKeyFromLabel(label: string): string {
  const map: Record<string, string> = {
    أسود: "black",
    بيج: "beige",
    زيتوني: "olive",
    كريمي: "cream",
  };
  if (map[label]) return map[label];
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32) || "color";
}

export function parseColorVariants(raw: unknown): ProductColorVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const key = String(row.key ?? "").trim();
      const label_ar = String(row.label_ar ?? "").trim();
      if (!key || !label_ar) return null;
      const images = Array.isArray(row.images)
        ? row.images.filter((v): v is string => typeof v === "string" && v.length > 0)
        : [];
      let fabric_images: Record<string, string[]> | undefined;
      if (row.fabric_images && typeof row.fabric_images === "object") {
        fabric_images = {};
        for (const [fabricKey, urls] of Object.entries(
          row.fabric_images as Record<string, unknown>
        )) {
          if (Array.isArray(urls)) {
            fabric_images[fabricKey] = urls.filter(
              (v): v is string => typeof v === "string" && v.length > 0
            );
          }
        }
      }
      return {
        key,
        label_ar,
        label_en: String(row.label_en ?? label_ar).trim() || label_ar,
        hex: String(row.hex ?? DEFAULT_COLOR_HEX[label_ar] ?? "#cccccc"),
        images,
        fabric_images,
      } satisfies ProductColorVariant;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

export function parseFabricOptions(raw: unknown): ProductFabricOption[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_FABRIC_OPTIONS;
  const parsed = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const key = String(row.key ?? "").trim();
      const label_ar = String(row.label_ar ?? "").trim();
      if (!key || !label_ar) return null;
      return {
        key,
        label_ar,
        label_en: String(row.label_en ?? label_ar).trim() || label_ar,
        price_adjustment: Number(row.price_adjustment ?? 0),
        description_ar: row.description_ar ? String(row.description_ar) : undefined,
        description_en: row.description_en ? String(row.description_en) : undefined,
        image: typeof row.image === "string" && row.image.length > 0 ? row.image : null,
      } satisfies ProductFabricOption;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
  return parsed.length > 0 ? parsed : DEFAULT_FABRIC_OPTIONS;
}

export function buildColorVariantsFromLegacy(product: {
  colors: string[];
  image: string | null;
  gallery: string[];
}): ProductColorVariant[] {
  const colors = product.colors.length > 0 ? product.colors : [...DEFAULT_COLOR_LABELS];
  const primaryImage = product.image ?? product.gallery[0] ?? null;
  const extraGallery = product.gallery.filter((url) => url && url !== primaryImage);

  return colors.map((label, index) => ({
    key: colorKeyFromLabel(label),
    label_ar: label,
    label_en: label,
    hex: DEFAULT_COLOR_HEX[label] ?? "#cccccc",
    images:
      index === 0
        ? [primaryImage, ...extraGallery].filter((v): v is string => Boolean(v))
        : [],
  }));
}

export function resolveColorVariants(product: {
  color_variants: ProductColorVariant[];
  colors: string[];
  image: string | null;
  gallery: string[];
}): ProductColorVariant[] {
  if (product.color_variants.length > 0) return product.color_variants;
  return buildColorVariantsFromLegacy(product);
}

export function resolveFabricOptions(fabric_options: ProductFabricOption[]): ProductFabricOption[] {
  return fabric_options.length > 0 ? fabric_options : DEFAULT_FABRIC_OPTIONS;
}

export function getVariantImages(
  variant: ProductColorVariant,
  fabricKey: string
): string[] {
  const premium = variant.fabric_images?.[fabricKey];
  if (fabricKey !== "standard" && premium?.length) return premium;
  return variant.images;
}

export function computeUnitPrice(
  basePrice: number,
  fabricOptions: ProductFabricOption[],
  fabricKey: string
): number {
  const fabric = fabricOptions.find((f) => f.key === fabricKey);
  return basePrice + (fabric?.price_adjustment ?? 0);
}

export function getProductCardImage(product: Product, fallback: string): string {
  const variants = resolveColorVariants({
    color_variants: product.color_variants ?? [],
    colors: product.colors,
    image: product.image,
    gallery: product.gallery,
  });
  return variants[0]?.images[0] ?? product.image ?? fallback;
}

export type ProductDetailDto = {
  id: string;
  product_type: ProductType;
  name_ar: string;
  name_en: string;
  price: number;
  image: string;
  gallery: string[];
  description_ar: string;
  description_en: string;
  features: string[];
  colors: string[];
  color_variants: ProductColorVariant[];
  fabric_options: ProductFabricOption[];
  active: boolean;
};

export function toProductDetailDto(
  product: Product,
  fallbackImage: (type: ProductType) => string
): ProductDetailDto {
  const color_variants = resolveColorVariants({
    color_variants: product.color_variants ?? [],
    colors: product.colors,
    image: product.image,
    gallery: product.gallery,
  });
  const fabric_options = resolveFabricOptions(product.fabric_options ?? []);
  const firstVariant = color_variants[0];
  const image =
    firstVariant?.images[0] ?? product.image ?? fallbackImage(product.product_type);
  const gallery =
    firstVariant?.images.length
      ? firstVariant.images
      : product.gallery.length > 0
        ? product.gallery
        : [image];

  return {
    id: product.id,
    product_type: product.product_type,
    name_ar: product.name_ar,
    name_en: product.name_en,
    price: product.price,
    image,
    gallery,
    description_ar:
      product.description_ar ??
      (product.product_type === "sash"
        ? "وشاح تخرج فاخر بتصميم أنيق"
        : "منتج تخرج بجودة عالية"),
    description_en: product.description_en ?? product.name_en,
    features:
      product.features.length > 0
        ? product.features
        : ["خامة فاخرة", "تصميم أنيق", "مناسب لجميع الجامعات"],
    colors: color_variants.map((v) => v.label_ar),
    color_variants,
    fabric_options,
    active: product.active,
  };
}
