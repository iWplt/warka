"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Crosshair,
  ExternalLink,
  Loader2,
  Map,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IRAQI_GOVERNORATES } from "@/lib/constants/iraq-market";
import {
  coordsFromDelivery,
  getGovernorateMapCenter,
  isValidDeliveryCoords,
} from "@/lib/delivery/location-utils";
import { getDeliveryDefaults } from "@/server/actions/delivery";
import { useDeliveryStore } from "@/stores/delivery-store";
import type { StudentAddress } from "@/types/database";
import { cn } from "@/lib/utils";
import { MapLocationPicker } from "@/components/features/delivery/map-location-picker";
import { LocationMapPreview } from "@/components/features/delivery/location-map-preview";

type DeliveryDetailsFormProps = {
  locale: "ar" | "en";
  compact?: boolean;
  showEstimate?: boolean;
  className?: string;
};

function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 5 && dow !== 6) added += 1;
  }
  return result;
}

function formatGregorianDate(date: Date, locale: "ar" | "en"): string {
  const intlLocale = locale === "ar" ? "ar-IQ-u-ca-gregory" : "en-GB";
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    calendar: "gregory",
  }).format(date);
}

export function DeliveryDetailsForm({
  locale,
  compact = false,
  showEstimate = true,
  className,
}: DeliveryDetailsFormProps) {
  const isAr = locale === "ar";
  const details = useDeliveryStore((s) => s.details);
  const setDetails = useDeliveryStore((s) => s.setDetails);
  const applySavedAddress = useDeliveryStore((s) => s.applySavedAddress);

  const [addresses, setAddresses] = useState<StudentAddress[]>([]);
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [locating, setLocating] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (
      (details.latitude != null || details.longitude != null) &&
      !isValidDeliveryCoords(details.latitude, details.longitude)
    ) {
      setDetails({ latitude: null, longitude: null, locationUrl: null });
    }
    // Only normalize stale persisted coords once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (defaultsLoaded) return;

    let cancelled = false;
    void getDeliveryDefaults()
      .then((defaults) => {
        if (cancelled || !defaults) return;
        setIsLoggedIn(true);
        setAddresses(defaults.addresses);

        const defaultAddress = defaults.addresses.find((a) => a.is_default) ?? defaults.addresses[0];
        if (defaultAddress && !details.savedAddressId && !details.governorate && !details.addressLine) {
          applySavedAddress(defaultAddress);
          return;
        }

        if (!details.phone && defaults.profile.phone) {
          setDetails({ phone: defaults.profile.phone });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDefaults(false);
          setDefaultsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applySavedAddress, defaultsLoaded, details.addressLine, details.governorate, details.phone, details.savedAddressId, setDetails]);

  const governorate = useMemo(
    () => IRAQI_GOVERNORATES.find((g) => g.en === details.governorate) ?? null,
    [details.governorate]
  );

  const estimate = useMemo(() => {
    if (!governorate) return null;
    const today = new Date();
    return {
      earliest: addBusinessDays(today, governorate.daysMin),
      latest: addBusinessDays(today, governorate.daysMax),
      governorate,
    };
  }, [governorate]);

  const mapDefaultCenter = useMemo(
    () =>
      details.governorate
        ? getGovernorateMapCenter(details.governorate)
        : getGovernorateMapCenter("Baghdad"),
    [details.governorate]
  );

  const saveCoords = (latitude: number, longitude: number) => {
    if (!isValidDeliveryCoords(latitude, longitude)) {
      toast.error(
        isAr
          ? "الموقع غير صحيح — افتح الخريطة وحدّد مكانك يدوياً"
          : "Invalid location — open the map and pick your spot manually"
      );
      setMapPickerOpen(true);
      return;
    }
    setDetails({
      ...coordsFromDelivery(latitude, longitude),
      savedAddressId: null,
    });
  };

  const hasValidLocation = isValidDeliveryCoords(details.latitude, details.longitude);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error(isAr ? "المتصفح لا يدعم تحديد الموقع" : "Geolocation is not supported");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isValidDeliveryCoords(latitude, longitude)) {
          toast.error(
            isAr
              ? "GPS ما رجّع موقع دقيق — افتح الخريطة وحدّد مكانك"
              : "GPS did not return an accurate location — pick on the map"
          );
          setMapPickerOpen(true);
          setLocating(false);
          return;
        }
        saveCoords(latitude, longitude);
        toast.success(
          isAr
            ? "تم جلب موقعك — افتح الخريطة إذا تحتاج تصحّحه"
            : "Location captured — open the map to adjust if needed"
        );
        setLocating(false);
      },
      () => {
        toast.error(
          isAr
            ? "تعذّر الوصول للموقع — فعّل GPS أو اكتب العنوان يدوياً"
            : "Could not get location — enable GPS or type the address"
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const selectClass =
    "mt-1.5 w-full rounded-xl border border-warka-border bg-card px-3 py-2.5 text-sm text-warka-text focus:outline-none focus:ring-2 focus:ring-warka-primary/30";

  return (
    <div
      className={cn(
        compact
          ? "space-y-3"
          : "rounded-2xl border border-warka-border bg-card p-4 shadow-card sm:p-5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warka-primary/12 text-warka-primary">
          <MapPin className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-warka-text">
            {isAr ? "تأكيد موقع التوصيل" : "Confirm delivery location"}
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-warka-text-muted">
            {isAr
              ? "نفس بيانات حسابك تظهر تلقائياً بعد تسجيل الدخول — أو اكتب عنواناً جديداً."
              : "Your saved details appear after login — or enter a new address."}
          </p>
        </div>
      </div>

      {loadingDefaults && (
        <p className="text-xs text-warka-text-muted">{isAr ? "جاري تحميل عناوينك…" : "Loading your addresses…"}</p>
      )}

      {isLoggedIn && addresses.length === 0 && defaultsLoaded && (
        <Link
          href="/student/addresses"
          className="inline-block text-xs font-semibold text-warka-primary hover:underline"
        >
          {isAr
            ? "احفظ عناوينك من حسابك — تتعبّى تلقائياً بالطلبات القادمة"
            : "Save addresses in your account — auto-filled on future orders"}
        </Link>
      )}

      {addresses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-warka-text-secondary">
            {isAr ? "عناوينك المحفوظة" : "Saved addresses"}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            {addresses.map((address) => {
              const selected = details.savedAddressId === address.id;
              return (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => applySavedAddress(address)}
                  className={cn(
                    "min-w-[140px] shrink-0 touch-manipulation rounded-xl border px-3 py-2.5 text-start text-xs transition-all",
                    selected
                      ? "border-warka-primary bg-warka-primary/10 shadow-sm"
                      : "border-warka-border bg-warka-bg/40 hover:border-warka-primary/40"
                  )}
                >
                  <span className="flex items-center gap-1 font-semibold text-warka-text">
                    {address.is_default && <Star className="size-3 fill-warka-primary text-warka-primary" />}
                    {address.label}
                  </span>
                  <span className="mt-1 line-clamp-2 text-warka-text-muted">{address.address_line}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        <div>
          <Label className="text-xs">{isAr ? "المحافظة *" : "Governorate *"}</Label>
          <select
            value={details.governorate}
            onChange={(e) =>
              setDetails({ governorate: e.target.value, savedAddressId: null })
            }
            className={selectClass}
          >
            <option value="">{isAr ? "اختر المحافظة" : "Select governorate"}</option>
            {IRAQI_GOVERNORATES.map((g) => (
              <option key={g.en} value={g.en}>
                {isAr ? g.ar : g.en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs">{isAr ? "المنطقة / الحي *" : "Area / district *"}</Label>
          <Input
            value={details.area}
            onChange={(e) => setDetails({ area: e.target.value, savedAddressId: null })}
            placeholder={isAr ? "مثال: الكرادة، الزيونة…" : "e.g. Karrada, Zayouna…"}
            className="mt-1.5 border-warka-border"
          />
        </div>

        <div className={compact ? "" : "sm:col-span-2"}>
          <Label className="text-xs">{isAr ? "العنوان التفصيلي *" : "Full address *"}</Label>
          <textarea
            value={details.addressLine}
            onChange={(e) => setDetails({ addressLine: e.target.value, savedAddressId: null })}
            rows={compact ? 2 : 3}
            placeholder={
              isAr ? "المبنى، الشارع، قرب…" : "Building, street, near…"
            }
            className={cn(selectClass, "resize-y")}
          />
        </div>

        <div>
          <Label className="text-xs">{isAr ? "علامة دالة (اختياري)" : "Landmark (optional)"}</Label>
          <Input
            value={details.landmark}
            onChange={(e) => setDetails({ landmark: e.target.value, savedAddressId: null })}
            placeholder={isAr ? "قرب جامعة، سوق…" : "Near university, market…"}
            className="mt-1.5 border-warka-border"
          />
        </div>

        <div>
          <Label className="text-xs">{isAr ? "هاتف التوصيل *" : "Delivery phone *"}</Label>
          <div className="relative mt-1.5">
            <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-warka-text-muted" />
            <Input
              dir="ltr"
              value={details.phone}
              onChange={(e) => setDetails({ phone: e.target.value, savedAddressId: null })}
              placeholder="07XXXXXXXXX"
              className="border-warka-border ps-10"
            />
          </div>
        </div>

        {!compact && (
          <div>
            <Label className="text-xs">{isAr ? "تاريخ التسليم المفضل" : "Preferred delivery date"}</Label>
            <Input
              type="date"
              value={details.preferredDate}
              onChange={(e) => setDetails({ preferredDate: e.target.value })}
              className="mt-1.5 border-warka-border"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-warka-primary/30 bg-warka-primary/5 p-3 sm:p-4 @container">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5">
            <Navigation className="mt-0.5 size-4 shrink-0 text-warka-primary" />
            <div>
              <p className="text-sm font-semibold text-warka-text">
                {isAr ? "موقع التوصيل على الخريطة" : "Delivery map location"}
              </p>
              <p className="mt-0.5 text-xs text-warka-text-muted">
                {isAr
                  ? "GPS ممكن يزحف شوي — الأفضل تفتح الخريطة وتضغط على مكانك بالضبط."
                  : "GPS can drift — best to open the map and tap your exact spot."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 @sm:flex-row @sm:items-stretch">
            <Button
              type="button"
              variant="accent"
              className="min-h-11 h-auto w-full touch-manipulation gap-2 px-4 py-2.5 text-center @sm:min-w-0 @sm:flex-1"
              onClick={() => setMapPickerOpen(true)}
            >
              <Map className="size-4 shrink-0" />
              {isAr ? "تحديد على الخريطة" : "Pick on map"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 h-auto w-full touch-manipulation gap-2 border-warka-primary/40 px-4 py-2.5 text-center text-warka-primary hover:bg-warka-primary/10 @sm:min-w-0 @sm:flex-1"
              onClick={captureLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Crosshair className="size-4" />
              )}
              {locating
                ? isAr
                  ? "جاري تحديد الموقع…"
                  : "Getting location…"
                : isAr
                  ? "موقعي الحالي (GPS)"
                  : "My GPS location"}
            </Button>
          </div>
        </div>

        {hasValidLocation && details.latitude != null && details.longitude != null && (
          <div className="mt-3 space-y-2">
            <LocationMapPreview
              latitude={details.latitude}
              longitude={details.longitude}
              locale={locale}
            />
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warka-border/60 bg-card px-3 py-2 text-xs">
              <MapPin className="size-3.5 text-warka-primary" />
              <span className="font-medium text-warka-text">
                {isAr ? "تم حفظ الموقع" : "Location saved"}
              </span>
              <span className="text-warka-text-muted" dir="ltr">
                {isAr ? "عرض: " : "Lat: "}
                {details.latitude.toFixed(5)}
                {isAr ? " · طول: " : " · Lng: "}
                {details.longitude.toFixed(5)}
              </span>
              {details.locationUrl && (
                <a
                  href={details.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-auto inline-flex items-center gap-1 font-semibold text-warka-primary hover:underline"
                >
                  {isAr ? "فتح في Google Maps" : "Open in Google Maps"}
                  <ExternalLink className="size-3" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setMapPickerOpen(true)}
                className="w-full pt-1 text-start text-xs font-semibold text-warka-primary hover:underline sm:w-auto sm:pt-0"
              >
                {isAr ? "تعديل على الخريطة" : "Adjust on map"}
              </button>
            </div>
          </div>
        )}
      </div>

      <MapLocationPicker
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        locale={locale}
        initialLat={details.latitude}
        initialLng={details.longitude}
        defaultCenter={mapDefaultCenter}
        onConfirm={(lat, lng) => {
          saveCoords(lat, lng);
          toast.success(isAr ? "تم حفظ موقعك من الخريطة" : "Map location saved");
        }}
      />

      {showEstimate && estimate && (
        <div className="flex items-start gap-3 rounded-xl border border-warka-primary/15 bg-warka-bg/60 p-3">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-warka-primary" />
          <div className="text-sm">
            <p className="font-medium text-warka-text">
              {isAr ? "التوصيل المتوقع" : "Expected delivery"}
            </p>
            <p className="mt-1 text-xs text-warka-text-secondary">
              {isAr
                ? `${estimate.governorate.ar}: ${estimate.governorate.daysMin}–${estimate.governorate.daysMax} أيام عمل`
                : `${estimate.governorate.en}: ${estimate.governorate.daysMin}–${estimate.governorate.daysMax} business days`}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-warka-primary" dir="ltr">
              {formatGregorianDate(estimate.earliest, locale)}
              {estimate.earliest.getTime() !== estimate.latest.getTime() && (
                <> — {formatGregorianDate(estimate.latest, locale)}</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
