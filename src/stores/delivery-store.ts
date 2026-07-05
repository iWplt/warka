"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IRAQI_GOVERNORATES } from "@/lib/constants/iraq-market";

export type DeliveryDetails = {
  governorate: string;
  area: string;
  addressLine: string;
  landmark: string;
  phone: string;
  preferredDate: string;
  latitude: number | null;
  longitude: number | null;
  locationUrl: string | null;
  label: string;
  savedAddressId: string | null;
};

export const emptyDeliveryDetails = (): DeliveryDetails => ({
  governorate: "",
  area: "",
  addressLine: "",
  landmark: "",
  phone: "",
  preferredDate: "",
  latitude: null,
  longitude: null,
  locationUrl: null,
  label: "",
  savedAddressId: null,
});

type DeliveryStore = {
  details: DeliveryDetails;
  setDetails: (patch: Partial<DeliveryDetails>) => void;
  applySavedAddress: (address: {
    id: string;
    label: string;
    address_line: string;
    city: string | null;
    phone: string | null;
    governorate?: string | null;
    area?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    location_url?: string | null;
  }) => void;
  reset: () => void;
};

function inferGovernorate(city: string | null | undefined, explicit?: string | null): string {
  if (explicit) return explicit;
  if (!city) return "";
  const match = IRAQI_GOVERNORATES.find((g) => g.ar === city || g.en === city);
  return match?.en ?? "";
}

export const useDeliveryStore = create<DeliveryStore>()(
  persist(
    (set) => ({
      details: emptyDeliveryDetails(),
      setDetails: (patch) =>
        set((state) => ({ details: { ...state.details, ...patch } })),
      applySavedAddress: (address) =>
        set({
          details: {
            ...emptyDeliveryDetails(),
            savedAddressId: address.id,
            label: address.label,
            addressLine: address.address_line,
            area: address.area ?? "",
            governorate: inferGovernorate(address.city, address.governorate),
            phone: address.phone ?? "",
            latitude: address.latitude ?? null,
            longitude: address.longitude ?? null,
            locationUrl: address.location_url ?? null,
          },
        }),
      reset: () => set({ details: emptyDeliveryDetails() }),
    }),
    { name: "warka-delivery-v1" }
  )
);
