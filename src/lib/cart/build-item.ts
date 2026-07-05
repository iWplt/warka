import {
  computeUnitPrice,
  getVariantImages,
  resolveColorVariants,
  resolveFabricOptions,
} from "@/lib/products/variants";
import type { AddCartItemInput } from "@/stores/cart-store";
import type { Product } from "@/types/database";

export function buildDefaultCartItemFromProduct(
  product: Product,
  locale: "ar" | "en",
  quantity = 1
): AddCartItemInput {
  const colorVariants = resolveColorVariants({
    color_variants: product.color_variants ?? [],
    colors: product.colors,
    image: product.image,
    gallery: product.gallery,
  });
  const fabricOptions = resolveFabricOptions(product.fabric_options ?? []);
  const variant = colorVariants[0];
  const fabric = fabricOptions[0];
  const fabricKey = fabric?.key ?? "standard";
  const image =
    (variant ? getVariantImages(variant, fabricKey)[0] : null) ??
    product.image ??
    "/assets/landing/product-sash.jpg";

  return {
    catalogProductId: product.id,
    productType: product.product_type,
    name_ar: product.name_ar,
    name_en: product.name_en,
    image,
    unitPrice: computeUnitPrice(Number(product.price), fabricOptions, fabricKey),
    quantity,
    colorKey: variant?.key ?? "",
    colorLabel: variant
      ? locale === "ar"
        ? variant.label_ar
        : variant.label_en
      : "",
    colorHex: variant?.hex ?? "#cccccc",
    fabricKey,
    fabricLabel: fabric
      ? locale === "ar"
        ? fabric.label_ar
        : fabric.label_en
      : "",
    diacriticsMode: "auto",
    decorationImageDataUrl: null,
  };
}
