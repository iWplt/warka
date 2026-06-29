import type { ProductType } from "@/types/database";
import { LANDING_IMAGES } from "@/lib/constants/landing-images";

export type GraduationProductMeta = {
  productType: ProductType;
  image: string;
  translationKey: "sash" | "cap" | "gown" | "suit" | "custom";
};

/** Visual metadata for graduation products (prices come from the API). */
export const GRADUATION_PRODUCT_META: GraduationProductMeta[] = [
  {
    productType: "sash",
    translationKey: "sash",
    image: LANDING_IMAGES.products.sash,
  },
  {
    productType: "cap",
    translationKey: "cap",
    image: LANDING_IMAGES.products.cap,
  },
  {
    productType: "gown",
    translationKey: "gown",
    image: LANDING_IMAGES.products.gown,
  },
  {
    productType: "suit",
    translationKey: "suit",
    image: LANDING_IMAGES.products.gown,
  },
  {
    productType: "custom",
    translationKey: "custom",
    image: LANDING_IMAGES.products.custom,
  },
];
