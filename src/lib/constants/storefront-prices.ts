import type { ProductType } from "@/types/database";

/** Default IQD prices when DB catalog / price_catalog unavailable */
export const DEFAULT_STOREFRONT_PRICES: Record<ProductType, number> = {
  sash: 25000,
  cap: 15000,
  gown: 45000,
  suit: 55000,
  custom: 35000,
};
