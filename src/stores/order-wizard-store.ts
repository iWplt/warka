"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaymentMethodId } from "@/components/payment/payment-methods-step";
import type { CustomizationPayload } from "@/types/customization";

export type WizardStudentData = {
  full_name: string;
  phone: string;
  college: string;
  department: string;
  graduation_year: string;
};

export type WizardDeliveryData = {
  governorate: string;
  area: string;
  phone: string;
  preferred_date: string;
};

export type LineEmbroideryDraft = {
  backShape: string;
  embroideryPosition: string;
  threadColor: string;
  embroideryNotes: string;
  embroideryImageDataUrl: string | null;
  capSideImageDataUrl: string | null;
  capTopImageDataUrl: string | null;
  capSideNotes: string;
  capTopNotes: string;
};

export const ORDER_WIZARD_STEPS = [
  { ar: "المنتجات", en: "Products" },
  { ar: "البيانات", en: "Details" },
  { ar: "المقاسات", en: "Sizes" },
  { ar: "الخط والتطريز", en: "Font & embroidery" },
  { ar: "الشعار", en: "Logo" },
  { ar: "المراجعة", en: "Review" },
  { ar: "العربون", en: "Deposit" },
  { ar: "الإرسال", en: "Submit" },
] as const;

const emptyEmbroidery = (): LineEmbroideryDraft => ({
  backShape: "",
  embroideryPosition: "",
  threadColor: "",
  embroideryNotes: "",
  embroideryImageDataUrl: null,
  capSideImageDataUrl: null,
  capTopImageDataUrl: null,
  capSideNotes: "",
  capTopNotes: "",
});

type OrderWizardState = {
  step: number;
  studentData: WizardStudentData;
  deliveryData: WizardDeliveryData;
  orderNotes: string;
  embroideryByLine: Record<string, LineEmbroideryDraft>;
  customizationByLine: Record<string, CustomizationPayload | null>;
  paymentMethod: PaymentMethodId;
  depositReceiptDataUrl: string | null;
  depositConfirmed: boolean;
  setStep: (step: number) => void;
  setStudentData: (data: Partial<WizardStudentData>) => void;
  setDeliveryData: (data: Partial<WizardDeliveryData>) => void;
  setOrderNotes: (notes: string) => void;
  setEmbroideryForLine: (lineId: string, patch: Partial<LineEmbroideryDraft>) => void;
  getEmbroideryForLine: (lineId: string) => LineEmbroideryDraft;
  setCustomizationForLine: (lineId: string, payload: CustomizationPayload | null) => void;
  getCustomizationForLine: (lineId: string) => CustomizationPayload | null;
  setPaymentMethod: (method: PaymentMethodId) => void;
  setDepositReceiptDataUrl: (url: string | null) => void;
  setDepositConfirmed: (value: boolean) => void;
  reset: () => void;
};

const initialStudent: WizardStudentData = {
  full_name: "",
  phone: "",
  college: "",
  department: "",
  graduation_year: String(new Date().getFullYear()),
};

const initialDelivery: WizardDeliveryData = {
  governorate: "",
  area: "",
  phone: "",
  preferred_date: "",
};

export const useOrderWizardStore = create<OrderWizardState>()(
  persist(
    (set, get) => ({
      step: 1,
      studentData: initialStudent,
      deliveryData: initialDelivery,
      orderNotes: "",
      embroideryByLine: {},
      customizationByLine: {},
      paymentMethod: "zain_cash",
      depositReceiptDataUrl: null,
      depositConfirmed: false,
      setStep: (step) => set({ step }),
      setStudentData: (data) =>
        set((s) => ({ studentData: { ...s.studentData, ...data } })),
      setDeliveryData: (data) =>
        set((s) => ({ deliveryData: { ...s.deliveryData, ...data } })),
      setOrderNotes: (orderNotes) => set({ orderNotes }),
      setEmbroideryForLine: (lineId, patch) =>
        set((s) => ({
          embroideryByLine: {
            ...s.embroideryByLine,
            [lineId]: { ...(s.embroideryByLine[lineId] ?? emptyEmbroidery()), ...patch },
          },
        })),
      getEmbroideryForLine: (lineId) =>
        get().embroideryByLine[lineId] ?? emptyEmbroidery(),
      setCustomizationForLine: (lineId, payload) =>
        set((s) => ({
          customizationByLine: { ...s.customizationByLine, [lineId]: payload },
        })),
      getCustomizationForLine: (lineId) => get().customizationByLine[lineId] ?? null,
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setDepositReceiptDataUrl: (depositReceiptDataUrl) => set({ depositReceiptDataUrl }),
      setDepositConfirmed: (depositConfirmed) => set({ depositConfirmed }),
      reset: () =>
        set({
          step: 1,
          studentData: initialStudent,
          deliveryData: initialDelivery,
          orderNotes: "",
          embroideryByLine: {},
          customizationByLine: {},
          paymentMethod: "zain_cash",
          depositReceiptDataUrl: null,
          depositConfirmed: false,
        }),
    }),
    { name: "warka-order-wizard-v2" }
  )
);
