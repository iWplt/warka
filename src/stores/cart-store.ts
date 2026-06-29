"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  notes: string;
  logoDataUrl: string | null;
  customized: boolean;
};

export type AddCartItemInput = Omit<CartLineItem, "id" | "customized" | "size" | "notes" | "logoDataUrl"> & {
  size?: string;
  notes?: string;
  logoDataUrl?: string | null;
};

type CartState = {
  items: CartLineItem[];
  addItem: (input: AddCartItemInput) => string;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateLine: (lineId: string, patch: Partial<Pick<CartLineItem, "size" | "notes" | "logoDataUrl" | "customized">>) => void;
  clearCart: () => void;
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
    a.size === (b.size ?? "")
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
              logoDataUrl: input.logoDataUrl ?? null,
              customized: false,
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

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, line) => sum + line.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    }),
    { name: "warka-cart-v1" }
  )
);
