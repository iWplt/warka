"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductType } from "@/types/database";

export type CheckoutStudentData = {
  full_name: string;
  phone: string;
  college: string;
  department: string;
  graduation_year: string;
};

type CatalogSelection = {
  catalogProductId: string;
  productType: ProductType;
  unitPrice: number;
  quantity: number;
  colorKey: string;
  colorLabel: string;
  fabricKey: string;
  fabricLabel: string;
};

type CheckoutState = {
  step: number;
  catalogProductId: string | null;
  productType: ProductType | null;
  unitPrice: number;
  quantity: number;
  sashColor: string;
  colorKey: string;
  fabricType: string;
  fabricLabel: string;
  notes: string;
  logoDataUrl: string | null;
  studentData: CheckoutStudentData;
  setStep: (step: number) => void;
  setProduct: (type: ProductType, quantity?: number) => void;
  setCatalogProduct: (
    catalogProductId: string,
    type: ProductType,
    unitPrice: number,
    quantity?: number
  ) => void;
  setCatalogSelection: (selection: CatalogSelection) => void;
  setQuantity: (quantity: number) => void;
  setSashColor: (color: string) => void;
  setNotes: (notes: string) => void;
  setLogoDataUrl: (url: string | null) => void;
  setStudentData: (data: Partial<CheckoutStudentData>) => void;
  reset: () => void;
};

const initialStudent: CheckoutStudentData = {
  full_name: "",
  phone: "",
  college: "",
  department: "",
  graduation_year: String(new Date().getFullYear()),
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      step: 1,
      catalogProductId: null,
      productType: null,
      unitPrice: 0,
      quantity: 1,
      sashColor: "أسود",
      colorKey: "",
      fabricType: "standard",
      fabricLabel: "",
      notes: "",
      logoDataUrl: null,
      studentData: initialStudent,
      setStep: (step) => set({ step }),
      setProduct: (productType, quantity = 1) =>
        set({ productType, quantity, catalogProductId: null }),
      setCatalogProduct: (catalogProductId, productType, unitPrice, quantity = 1) =>
        set({ catalogProductId, productType, unitPrice, quantity }),
      setCatalogSelection: (selection) =>
        set({
          catalogProductId: selection.catalogProductId,
          productType: selection.productType,
          unitPrice: selection.unitPrice,
          quantity: selection.quantity,
          sashColor: selection.colorLabel,
          colorKey: selection.colorKey,
          fabricType: selection.fabricKey,
          fabricLabel: selection.fabricLabel,
          step: 1,
        }),
      setQuantity: (quantity) => set({ quantity }),
      setSashColor: (sashColor) => set({ sashColor }),
      setNotes: (notes) => set({ notes }),
      setLogoDataUrl: (logoDataUrl) => set({ logoDataUrl }),
      setStudentData: (data) =>
        set((s) => ({ studentData: { ...s.studentData, ...data } })),
      reset: () =>
        set({
          step: 1,
          catalogProductId: null,
          productType: null,
          unitPrice: 0,
          quantity: 1,
          sashColor: "أسود",
          colorKey: "",
          fabricType: "standard",
          fabricLabel: "",
          notes: "",
          logoDataUrl: null,
          studentData: initialStudent,
        }),
    }),
    { name: "warka-checkout" }
  )
);
