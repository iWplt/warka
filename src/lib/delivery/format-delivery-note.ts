import { IRAQI_GOVERNORATES } from "@/lib/constants/iraq-market";
import type { DeliveryDetails } from "@/stores/delivery-store";

export function formatDeliveryNote(details: DeliveryDetails, locale: "ar" | "en"): string {
  const isAr = locale === "ar";
  const gov = IRAQI_GOVERNORATES.find((g) => g.en === details.governorate);
  const govLabel = isAr ? gov?.ar : gov?.en;

  const lines = [
    govLabel
      ? isAr
        ? `المحافظة: ${govLabel}`
        : `Governorate: ${govLabel}`
      : null,
    details.area.trim()
      ? isAr
        ? `المنطقة: ${details.area.trim()}`
        : `Area: ${details.area.trim()}`
      : null,
    details.addressLine.trim()
      ? isAr
        ? `العنوان: ${details.addressLine.trim()}`
        : `Address: ${details.addressLine.trim()}`
      : null,
    details.landmark.trim()
      ? isAr
        ? `علامة دالة: ${details.landmark.trim()}`
        : `Landmark: ${details.landmark.trim()}`
      : null,
    details.phone.trim()
      ? isAr
        ? `هاتف التوصيل: ${details.phone.trim()}`
        : `Delivery phone: ${details.phone.trim()}`
      : null,
    details.preferredDate
      ? isAr
        ? `تاريخ التسليم المطلوب: ${details.preferredDate}`
        : `Preferred delivery date: ${details.preferredDate}`
      : null,
    details.locationUrl
      ? isAr
        ? `موقع GPS: ${details.locationUrl}`
        : `GPS location: ${details.locationUrl}`
      : details.latitude != null && details.longitude != null
        ? isAr
          ? `إحداثيات: ${details.latitude}, ${details.longitude}`
          : `Coordinates: ${details.latitude}, ${details.longitude}`
        : null,
    details.label.trim()
      ? isAr
        ? `تسمية العنوان: ${details.label.trim()}`
        : `Address label: ${details.label.trim()}`
      : null,
  ].filter(Boolean);

  return lines.join("\n");
}

export function isDeliveryComplete(details: DeliveryDetails): boolean {
  return Boolean(
    details.governorate &&
      details.area.trim() &&
      details.addressLine.trim() &&
      details.phone.trim().length >= 7
  );
}
