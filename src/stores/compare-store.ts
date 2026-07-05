"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, ProductType } from "@/types/database";

export const MAX_COMPARE_ITEMS = 3;

export type CompareProduct = {
  id: string;
  name_ar: string;
  name_en: string;
  image: string;
  price: number;
  product_type: ProductType;
  description_ar: string | null;
  description_en: string | null;
  features: string[];
  colors: string[];
};

type CompareState = {
  items: CompareProduct[];
  addProduct: (product: CompareProduct) => boolean;
  removeProduct: (id: string) => void;
  clearAll: () => void;
  hasProduct: (id: string) => boolean;
  isFull: () => boolean;
  count: () => number;
};

export function productToCompareItem(product: Product): CompareProduct {
  return {
    id: product.id,
    name_ar: product.name_ar,
    name_en: product.name_en,
    image: product.image ?? "/assets/landing/product-sash.jpg",
    price: product.price,
    product_type: product.product_type,
    description_ar: product.description_ar,
    description_en: product.description_en,
    features: product.features ?? [],
    colors: product.colors ?? [],
  };
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      addProduct: (product) => {
        if (get().items.some((item) => item.id === product.id)) return true;
        if (get().items.length >= MAX_COMPARE_ITEMS) return false;
        set({ items: [...get().items, product] });
        return true;
      },

      removeProduct: (id) =>
        set({ items: get().items.filter((item) => item.id !== id) }),

      clearAll: () => set({ items: [] }),

      hasProduct: (id) => get().items.some((item) => item.id === id),

      isFull: () => get().items.length >= MAX_COMPARE_ITEMS,

      count: () => get().items.length,
    }),
    { name: "warka-compare-v1" }
  )
);
