export type GeoMessageKey =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout"
  | "inaccurate";

export type GeoResult =
  | { ok: true; lat: number; lng: number; accuracy: number }
  | { ok: false; code: number; messageKey: GeoMessageKey };

export type GeoPermissionState = "granted" | "denied" | "prompt" | "unknown";

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

/** Query Permissions API when available (Chrome/Android/desktop). */
export async function getGeolocationPermissionState(): Promise<GeoPermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unknown";
  }
  try {
    const status = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    if (status.state === "granted" || status.state === "denied" || status.state === "prompt") {
      return status.state;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Request device GPS. Triggers the browser permission dialog when state is "prompt".
 * Tries network/cell first, then high-accuracy — works better across Android/iOS/desktop.
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

  if (low.messageKey === "timeout" || high.messageKey === "timeout") {
    return { ok: false, code: 3, messageKey: "timeout" };
  }
  return high.messageKey !== "unavailable" ? high : low;
}

export function geoErrorMessage(key: GeoMessageKey, isAr: boolean): string {
  if (key === "unsupported") {
    return isAr
      ? "هذا المتصفح لا يدعم تحديد الموقع — حدّد يدوياً على الخريطة"
      : "This browser does not support location — pick manually on the map";
  }
  if (key === "denied") {
    return isAr
      ? "صلاحية الموقع مرفوضة — اسمح بالوصول للموقع من إعدادات المتصفح لهذا الموقع، ثم اضغط «جلب موقعي» مرة ثانية"
      : "Location permission denied — allow location for this site in browser settings, then tap “Use my GPS” again";
  }
  if (key === "timeout") {
    return isAr
      ? "انتهت مهلة تحديد الموقع — تأكد أن GPS / الموقع شغّال، أو حدّد يدوياً على الخريطة"
      : "Location timed out — turn on GPS / Location, or pick manually on the map";
  }
  if (key === "inaccurate") {
    return isAr
      ? "الموقع غير دقيق — حرّك الدبوس أو اضغط على مكانك على الخريطة"
      : "Location inaccurate — drag the pin or tap your spot on the map";
  }
  return isAr
    ? "تعذّر جلب الموقع — اسمح بالصلاحية أو حدّد يدوياً على الخريطة"
    : "Could not get location — allow permission or pick manually on the map";
}
