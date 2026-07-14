export type GeoResult =
  | { ok: true; lat: number; lng: number; accuracy: number }
  | { ok: false; code: number; messageKey: "unsupported" | "denied" | "unavailable" | "timeout" | "inaccurate" };

function positionOptions(highAccuracy: boolean, timeoutMs: number): PositionOptions {
  return {
    enableHighAccuracy: highAccuracy,
    timeout: timeoutMs,
    maximumAge: highAccuracy ? 0 : 120_000,
  };
}

function readPosition(pos: GeolocationPosition): GeoResult {
  const { latitude, longitude, accuracy } = pos.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, code: 2, messageKey: "inaccurate" };
  }
  if (Math.abs(latitude) < 0.0001 && Math.abs(longitude) < 0.0001) {
    return { ok: false, code: 2, messageKey: "inaccurate" };
  }
  return { ok: true, lat: latitude, lng: longitude, accuracy: accuracy ?? 0 };
}

function mapGeoError(err: GeolocationPositionError): GeoResult {
  if (err.code === err.PERMISSION_DENIED) {
    return { ok: false, code: err.code, messageKey: "denied" };
  }
  if (err.code === err.TIMEOUT) {
    return { ok: false, code: err.code, messageKey: "timeout" };
  }
  return { ok: false, code: err.code, messageKey: "unavailable" };
}

function getPositionOnce(options: PositionOptions): Promise<GeoResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ok: false, code: 0, messageKey: "unsupported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(readPosition(pos)),
      (err) => resolve(mapGeoError(err)),
      options
    );
  });
}

/**
 * iOS Safari often fails with enableHighAccuracy + short timeouts.
 * Try network/cell first, then a high-accuracy retry.
 */
export async function requestDeviceLocation(): Promise<GeoResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ok: false, code: 0, messageKey: "unsupported" };
  }

  const low = await getPositionOnce(positionOptions(false, 12_000));
  if (low.ok) return low;
  if (low.messageKey === "denied" || low.messageKey === "unsupported") return low;

  const high = await getPositionOnce(positionOptions(true, 20_000));
  if (high.ok) return high;

  // Prefer the more specific denial/timeout from either attempt
  if (low.messageKey === "timeout" || high.messageKey === "timeout") {
    return { ok: false, code: 3, messageKey: "timeout" };
  }
  return high.messageKey !== "unavailable" ? high : low;
}

export function geoErrorMessage(
  key: "unsupported" | "denied" | "unavailable" | "timeout" | "inaccurate",
  isAr: boolean
): string {
  if (key === "unsupported") {
    return isAr ? "المتصفح لا يدعم تحديد الموقع" : "Geolocation is not supported";
  }
  if (key === "denied") {
    return isAr
      ? "صلاحية الموقع مرفوضة — من إعدادات Safari فعّل الموقع لهذا الموقع، أو حدّد يدوياً على الخريطة"
      : "Location permission denied — enable it in Safari settings, or pick manually on the map";
  }
  if (key === "timeout") {
    return isAr
      ? "انتهت مهلة GPS — تأكد أن خدمات الموقع شغّالة، أو حدّد يدوياً على الخريطة"
      : "GPS timed out — turn on Location Services, or pick manually on the map";
  }
  if (key === "inaccurate") {
    return isAr
      ? "GPS ما رجّع موقع دقيق — حدّد يدوياً على الخريطة"
      : "GPS location inaccurate — pick manually on the map";
  }
  return isAr
    ? "تعذّر الوصول للموقع — حدّد يدوياً على الخريطة"
    : "Could not get GPS — pick manually on the map";
}
