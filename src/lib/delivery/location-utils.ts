import { GOVERNORATE_COORDS } from "@/lib/constants/iraq-market";

export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Reject null island and other obviously bad GPS reads */
export function isValidDeliveryCoords(lat: number | null, lng: number | null): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return true;
}

export function getGovernorateMapCenter(governorateEn: string): { lat: number; lng: number } {
  const coords = GOVERNORATE_COORDS[governorateEn as keyof typeof GOVERNORATE_COORDS];
  return coords ?? GOVERNORATE_COORDS.Baghdad;
}

export function coordsFromDelivery(
  lat: number,
  lng: number
): { latitude: number; longitude: number; locationUrl: string } {
  return {
    latitude: lat,
    longitude: lng,
    locationUrl: buildGoogleMapsUrl(lat, lng),
  };
}
