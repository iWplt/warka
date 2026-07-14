"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Crosshair, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  geoErrorMessage,
  getGeolocationPermissionState,
  requestDeviceLocation,
  type GeoMessageKey,
} from "@/lib/delivery/geolocation";
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
  /** When true, request GPS as soon as the map opens (after user tapped open/GPS). */
  autoLocate?: boolean;
};

const DEFAULT_CENTER = { lat: 33.3152, lng: 44.3661 };

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OSM</a> &copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a>';

const TILE_FALLBACK_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

export function MapLocationPicker({
  open,
  onOpenChange,
  locale,
  initialLat,
  initialLng,
  defaultCenter = DEFAULT_CENTER,
  onConfirm,
  autoLocate = true,
}: MapLocationPickerProps) {
  const isAr = locale === "ar";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const initGenRef = useRef(0);
  const autoLocateAttemptedRef = useRef(false);

  const [draftLat, setDraftLat] = useState<number | null>(initialLat ?? null);
  const [draftLng, setDraftLng] = useState<number | null>(initialLng ?? null);
  const [locating, setLocating] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [geoHint, setGeoHint] = useState<GeoMessageKey | null>(null);

  useEffect(() => {
    if (!open) {
      autoLocateAttemptedRef.current = false;
      setGeoHint(null);
      setMapReady(false);
      return;
    }

    let cancelled = false;
    const gen = ++initGenRef.current;
    setLoadingMap(true);
    setMapReady(false);

    void (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || gen !== initGenRef.current || !mapContainerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      mapContainerRef.current.innerHTML = "";

      const startLat = initialLat ?? defaultCenter.lat;
      const startLng = initialLng ?? defaultCenter.lng;
      const startZoom = initialLat != null ? 16 : 12;

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: startZoom,
        zoomControl: true,
        attributionControl: true,
      });
      map.attributionControl.setPrefix(false);

      const primaryTiles = L.tileLayer(TILE_URL, {
        attribution: TILE_ATTR,
        maxZoom: 19,
        subdomains: "abcd",
        crossOrigin: true,
      });

      let usedFallback = false;
      primaryTiles.on("tileerror", () => {
        if (usedFallback || cancelled || gen !== initGenRef.current || !mapRef.current) return;
        usedFallback = true;
        map.removeLayer(primaryTiles);
        L.tileLayer(TILE_FALLBACK_URL, {
          attribution: "Tiles &copy; Esri",
          maxZoom: 19,
          crossOrigin: true,
        }).addTo(map);
      });
      primaryTiles.addTo(map);

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
      setMapReady(true);

      const refreshSize = () => {
        if (cancelled || gen !== initGenRef.current || !mapRef.current) return;
        mapRef.current.invalidateSize({ animate: false });
      };
      requestAnimationFrame(refreshSize);
      window.setTimeout(refreshSize, 120);
      window.setTimeout(refreshSize, 350);
      window.setTimeout(refreshSize, 700);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = "";
      }
    };
  }, [open, defaultCenter.lat, defaultCenter.lng, initialLat, initialLng]);

  const applyLocation = (lat: number, lng: number) => {
    markerRef.current?.setLatLng([lat, lng]);
    mapRef.current?.setView([lat, lng], 17, { animate: true });
    mapRef.current?.invalidateSize({ animate: false });
    setDraftLat(lat);
    setDraftLng(lng);
    setGeoHint(null);
  };

  const useMyLocation = async (opts?: { quiet?: boolean }) => {
    setLocating(true);
    setGeoHint(null);
    const result = await requestDeviceLocation();
    if (!result.ok) {
      setGeoHint(result.messageKey);
      if (!opts?.quiet) {
        toast.error(geoErrorMessage(result.messageKey, isAr));
      }
      setLocating(false);
      return;
    }
    if (!isValidDeliveryCoords(result.lat, result.lng)) {
      setGeoHint("inaccurate");
      if (!opts?.quiet) toast.error(geoErrorMessage("inaccurate", isAr));
      setLocating(false);
      return;
    }
    applyLocation(result.lat, result.lng);
    if (!opts?.quiet) {
      toast.success(
        isAr
          ? "تم جلب موقعك — حرّك الدبوس إذا كان فيه خطأ"
          : "Location loaded — drag the pin if it looks wrong"
      );
    }
    setLocating(false);
  };

  // After map is ready: ask for location permission (browser dialog) if we don't already have coords.
  useEffect(() => {
    if (!open || !mapReady || !autoLocate) return;
    if (autoLocateAttemptedRef.current) return;
    if (isValidDeliveryCoords(initialLat ?? null, initialLng ?? null)) return;

    autoLocateAttemptedRef.current = true;
    let cancelled = false;

    void (async () => {
      const permission = await getGeolocationPermissionState();
      if (cancelled) return;
      if (permission === "denied") {
        setGeoHint("denied");
        return;
      }
      setLocating(true);
      setGeoHint(null);
      const result = await requestDeviceLocation();
      if (cancelled) return;
      if (!result.ok) {
        setGeoHint(result.messageKey);
        setLocating(false);
        return;
      }
      if (!isValidDeliveryCoords(result.lat, result.lng)) {
        setGeoHint("inaccurate");
        setLocating(false);
        return;
      }
      markerRef.current?.setLatLng([result.lat, result.lng]);
      mapRef.current?.setView([result.lat, result.lng], 17, { animate: true });
      mapRef.current?.invalidateSize({ animate: false });
      setDraftLat(result.lat);
      setDraftLng(result.lng);
      setGeoHint(null);
      setLocating(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, mapReady, autoLocate, initialLat, initialLng]);

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
            "fixed z-[71] flex flex-col overflow-hidden border border-warka-border bg-card shadow-tint-lg outline-none",
            "inset-x-0 bottom-0 top-[max(0.75rem,env(safe-area-inset-top))] max-h-[min(96dvh,920px)] rounded-t-2xl",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(88dvh,720px)] sm:w-[min(calc(100vw-1.5rem),640px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-warka-border px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-bold text-warka-text">
                {isAr ? "تحديد موقع التوصيل على الخريطة" : "Pick delivery location on map"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-relaxed text-warka-text-muted">
                {isAr
                  ? "اسمح بالوصول للموقع لمعاينة مكانك، أو اضغط/اسحب على الخريطة يدوياً."
                  : "Allow location to preview your spot, or tap/drag on the map manually."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warka-bg text-warka-text transition-colors hover:bg-warka-primary/10"
              aria-label={isAr ? "إغلاق" : "Close"}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="relative min-h-[min(48dvh,380px)] flex-1 bg-warka-bg">
            <div ref={mapContainerRef} className="absolute inset-0 z-0 min-h-[240px]" />
            {loadingMap && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70">
                <Loader2 className="size-8 animate-spin text-warka-primary" />
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-warka-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            {geoHint && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
                <p>{geoErrorMessage(geoHint, isAr)}</p>
                {geoHint === "denied" && (
                  <p className="mt-1.5 text-warka-text-muted">
                    {isAr
                      ? "Android / Chrome: أيقونة القفل بجانب الرابط ← أذونات الموقع ← سماح. ثم اضغط «جلب موقعي»."
                      : "Android/Chrome: lock icon near the URL → Site settings → Location → Allow, then tap Use my GPS."}
                  </p>
                )}
              </div>
            )}

            {draftLat != null && draftLng != null && (
              <p className="flex items-center gap-2 text-xs text-warka-text-secondary" dir="ltr">
                <MapPin className="size-3.5 shrink-0 text-warka-primary" />
                {draftLat.toFixed(5)}, {draftLng.toFixed(5)}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 h-auto w-full touch-manipulation gap-2 border-warka-primary/40 px-4 py-2.5 text-center text-warka-primary sm:min-w-0 sm:flex-1"
                onClick={() => void useMyLocation()}
                disabled={locating || loadingMap}
              >
                {locating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Crosshair className="size-4" />
                )}
                {locating
                  ? isAr
                    ? "جاري طلب الموقع…"
                    : "Requesting location…"
                  : isAr
                    ? "جلب موقعي (GPS)"
                    : "Use my GPS"}
              </Button>
              <Button
                type="button"
                variant="accent"
                className="min-h-11 h-auto w-full touch-manipulation px-4 py-2.5 text-center sm:min-w-0 sm:flex-1"
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
