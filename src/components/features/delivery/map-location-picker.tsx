"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Crosshair, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isValidDeliveryCoords } from "@/lib/delivery/location-utils";
import { cn } from "@/lib/utils";

type MapLocationPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "ar" | "en";
  initialLat?: number | null;
  initialLng?: number | null;
  defaultCenter?: { lat: number; lng: number };
  onConfirm: (lat: number, lng: number) => void;
};

const DEFAULT_CENTER = { lat: 33.3152, lng: 44.3661 };

export function MapLocationPicker({
  open,
  onOpenChange,
  locale,
  initialLat,
  initialLng,
  defaultCenter = DEFAULT_CENTER,
  onConfirm,
}: MapLocationPickerProps) {
  const isAr = locale === "ar";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);

  const [draftLat, setDraftLat] = useState<number | null>(initialLat ?? null);
  const [draftLng, setDraftLng] = useState<number | null>(initialLng ?? null);
  const [locating, setLocating] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingMap(true);

    void (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapContainerRef.current) return;

      const startLat = initialLat ?? defaultCenter.lat;
      const startLng = initialLng ?? defaultCenter.lng;
      const startZoom = initialLat != null ? 16 : 12;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: startZoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "warka-map-pin",
        html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#2d5016" stroke="#fff" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([startLat, startLng], { draggable: true, icon }).addTo(map);

      const syncCoords = (lat: number, lng: number) => {
        setDraftLat(lat);
        setDraftLng(lng);
      };

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        syncCoords(pos.lat, pos.lng);
      });

      map.on("click", (event) => {
        marker.setLatLng(event.latlng);
        syncCoords(event.latlng.lat, event.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      syncCoords(startLat, startLng);
      setLoadingMap(false);

      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open, defaultCenter.lat, defaultCenter.lng, initialLat, initialLng]);

  const useMyLocation = () => {
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
              ? "GPS ما رجّع موقع دقيق — حدّد يدوياً على الخريطة"
              : "GPS location inaccurate — pick manually on the map"
          );
          setLocating(false);
          return;
        }
        markerRef.current?.setLatLng([latitude, longitude]);
        mapRef.current?.setView([latitude, longitude], 17, { animate: true });
        setDraftLat(latitude);
        setDraftLng(longitude);
        toast.success(
          isAr
            ? "تم جلب موقعك — حرّك الدبوس إذا كان فيه خطأ"
            : "Location loaded — drag the pin if it looks wrong"
        );
        setLocating(false);
      },
      () => {
        toast.error(
          isAr
            ? "تعذّر الوصول للموقع — حدّد يدوياً على الخريطة"
            : "Could not get GPS — pick manually on the map"
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleConfirm = () => {
    if (draftLat == null || draftLng == null) {
      toast.error(isAr ? "اضغط على الخريطة لتحديد موقعك" : "Tap the map to set your location");
      return;
    }
    onConfirm(draftLat, draftLng);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/55 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[71] flex max-h-[min(88dvh,720px)] w-[min(calc(100vw-1.5rem),640px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-warka-border bg-card shadow-tint-lg outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-warka-border px-4 py-3 sm:px-5">
            <div>
              <Dialog.Title className="text-base font-bold text-warka-text">
                {isAr ? "تحديد موقع التوصيل على الخريطة" : "Pick delivery location on map"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-relaxed text-warka-text-muted">
                {isAr
                  ? "اضغط على المكان الصحيح أو اسحب الدبوس — مفيد إذا GPS زاحف أو مو دقيق."
                  : "Tap the correct spot or drag the pin — useful when GPS is off or inaccurate."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warka-bg text-warka-text transition-colors hover:bg-warka-primary/10"
              aria-label={isAr ? "إغلاق" : "Close"}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="relative min-h-[min(52dvh,420px)] flex-1 bg-warka-bg">
            <div ref={mapContainerRef} className="absolute inset-0 z-0 min-h-[280px]" />
            {loadingMap && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70">
                <Loader2 className="size-8 animate-spin text-warka-primary" />
              </div>
            )}
          </div>

          <div className="@container space-y-3 border-t border-warka-border px-4 py-3 sm:px-5">
            {draftLat != null && draftLng != null && (
              <p className="flex items-center gap-2 text-xs text-warka-text-secondary" dir="ltr">
                <MapPin className="size-3.5 shrink-0 text-warka-primary" />
                {draftLat.toFixed(5)}, {draftLng.toFixed(5)}
              </p>
            )}

            <div className="flex flex-col gap-2 @sm:flex-row @sm:items-stretch">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 h-auto w-full touch-manipulation gap-2 border-warka-primary/40 px-4 py-2.5 text-center text-warka-primary @sm:min-w-0 @sm:flex-1"
                onClick={useMyLocation}
                disabled={locating || loadingMap}
              >
                {locating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Crosshair className="size-4" />
                )}
                {isAr ? "جلب موقعي (GPS)" : "Use my GPS"}
              </Button>
              <Button
                type="button"
                variant="accent"
                className="min-h-11 h-auto w-full touch-manipulation px-4 py-2.5 text-center @sm:min-w-0 @sm:flex-1"
                onClick={handleConfirm}
                disabled={loadingMap || draftLat == null}
              >
                {isAr ? "تأكيد هذا الموقع" : "Confirm this location"}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
