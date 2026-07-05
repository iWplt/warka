import { getTranslations } from "next-intl/server";
import type { ProductType } from "@/types/database";

const PRODUCT_TYPES: ProductType[] = ["sash", "cap", "gown", "suit", "custom"];

export async function getProductTypeLabels(): Promise<Record<ProductType, string>> {
  const t = await getTranslations("productType");
  return Object.fromEntries(PRODUCT_TYPES.map((type) => [type, t(type)])) as Record<
    ProductType,
    string
  >;
}
