"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { computeUnitPrice, resolveFabricOptions } from "@/lib/products/variants";
import type { CustomizationPayload } from "@/types/customization";
import type { ProductType } from "@/types/database";

export type CartLineItem = {
  id: string;
  catalogProductId: string;
  productType: ProductType;
  name_ar: string;
  name_en: string;
  image: string;
  unitPrice: number;
  quantity: number;
  colorKey: string;
  colorLabel: string;
  colorHex: string;
  fabricKey: string;
  fabricLabel: string;
  size: string;
  customText: string;
  fontFamily: string;
  diacriticsMode: import("@/lib/arabic/harakat").DiacriticsMode;
  decorationImageDataUrl: string | null;
  capSideImageDataUrl: string | null;
  capTopImageDataUrl: string | null;
  embroideryPosition: string;
  notes: string;
  logoDataUrl: string | null;
  customizationPayload: CustomizationPayload | null;
  customized: boolean;
};

export type AddCartItemInput = Omit<
  CartLineItem,
  "id" | "customized" | "size" | "notes" | "logoDataUrl" | "customText" | "fontFamily" | "embroideryPosition" | "diacriticsMode" | "decorationImageDataUrl" | "capSideImageDataUrl" | "capTopImageDataUrl" | "customizationPayload"
> & {
  size?: string;
  notes?: string;
  logoDataUrl?: string | null;
  customText?: string;
  fontFamily?: string;
  embroideryPosition?: string;
  diacriticsMode?: import("@/lib/arabic/harakat").DiacriticsMode;
  decorationImageDataUrl?: string | null;
  capSideImageDataUrl?: string | null;
  capTopImageDataUrl?: string | null;
  customizationPayload?: CustomizationPayload | null;
};

type CartState = {
  items: CartLineItem[];
  addItem: (input: AddCartItemInput) => string;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateLine: (
    lineId: string,
    patch: Partial<
      Pick<
        CartLineItem,
        | "size"
        | "notes"
        | "logoDataUrl"
        | "customized"
        | "unitPrice"
        | "customText"
        | "fontFamily"
        | "embroideryPosition"
        | "diacriticsMode"
        | "decorationImageDataUrl"
        | "capSideImageDataUrl"
        | "capTopImageDataUrl"
        | "customizationPayload"
      >
    >
  ) => void;
  syncPricesFromCatalog: (
    products: Array<{
      id: string;
      product_type: ProductType;
      price: number;
      fabric_options?: import("@/types/database").ProductFabricOption[];
    }>
  ) => void;
  clearCart: () => void;
  restoreItems: (items: CartLineItem[]) => void;
  itemCount: () => number;
  subtotal: () => number;
};

function createLineId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sameLine(a: CartLineItem, b: AddCartItemInput): boolean {
  return (
    a.catalogProductId === b.catalogProductId &&
    a.colorKey === b.colorKey &&
    a.fabricKey === b.fabricKey &&
    a.size === (b.size ?? "") &&
    a.customText === (b.customText ?? "") &&
    a.fontFamily === (b.fontFamily ?? "") &&
    a.embroideryPosition === (b.embroideryPosition ?? "")
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        const existing = get().items.find((line) => sameLine(line, input));
        if (existing) {
          set({
            items: get().items.map((line) =>
              line.id === existing.id
                ? { ...line, quantity: Math.min(99, line.quantity + input.quantity) }
                : line
            ),
          });
          return existing.id;
        }

        const id = createLineId();
        set({
          items: [
            ...get().items,
            {
              ...input,
              id,
              size: input.size ?? "",
              notes: input.notes ?? "",
              customText: input.customText ?? "",
              fontFamily: input.fontFamily ?? "",
              diacriticsMode: input.diacriticsMode ?? "auto",
              decorationImageDataUrl: input.decorationImageDataUrl ?? null,
              capSideImageDataUrl: input.capSideImageDataUrl ?? null,
              capTopImageDataUrl: input.capTopImageDataUrl ?? null,
              embroideryPosition: input.embroideryPosition ?? "",
              logoDataUrl: input.logoDataUrl ?? null,
              customizationPayload: input.customizationPayload ?? null,
              customized: Boolean(
                input.size ||
                  input.customText ||
                  input.fontFamily ||
                  input.embroideryPosition ||
                  input.customizationPayload
              ),
            },
          ],
        });
        return id;
      },

      removeItem: (lineId) =>
        set({ items: get().items.filter((line) => line.id !== lineId) }),

      updateQuantity: (lineId, quantity) =>
        set({
          items: get().items.map((line) =>
            line.id === lineId
              ? { ...line, quantity: Math.min(99, Math.max(1, quantity)) }
              : line
          ),
        }),

      updateLine: (lineId, patch) =>
        set({
          items: get().items.map((line) =>
            line.id === lineId ? { ...line, ...patch } : line
          ),
        }),

      syncPricesFromCatalog: (products) =>
        set({
          items: get().items.map((line) => {
            const product =
              products.find((p) => p.id === line.catalogProductId) ??
              products.find((p) => p.product_type === line.productType);
            if (!product || product.price <= 0) return line;

            const fabricOptions = resolveFabricOptions(product.fabric_options ?? []);
            const unitPrice = computeUnitPrice(product.price, fabricOptions, line.fabricKey);
            if (unitPrice === line.unitPrice && product.id === line.catalogProductId) {
              return line;
            }
            return {
              ...line,
              catalogProductId: product.id,
              unitPrice,
            };
          }),
        }),

      clearCart: () => set({ items: [] }),

      /** Restore items from a checkout handoff — only when the cart is empty,
       *  so we never duplicate an already-hydrated cart. */
      restoreItems: (items) => {
        if (get().items.length > 0 || items.length === 0) return;
        set({ items });
      },

      itemCount: () => get().items.reduce((sum, line) => sum + line.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    }),
    { name: "warka-cart-v1" }
  )
);

/**
 * Reliable hydration flag for the persisted cart. Returns false during SSR and
 * until zustand finishes rehydrating from storage — use it to avoid rendering an
 * empty-cart state before the real cart is known.
 */
export function useCartHasHydrated(): boolean {
  return useSyncExternalStore(
    useCartStore.persist.onFinishHydration,
    () => useCartStore.persist.hasHydrated(),
    () => false
  );
}
