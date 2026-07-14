"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type LocationMapPreviewProps = {
  latitude: number;
  longitude: number;
  locale: "ar" | "en";
  className?: string;
};

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO';

export function LocationMapPreview({
  latitude,
  longitude,
  locale,
  className,
}: LocationMapPreviewProps) {
  const isAr = locale === "ar";
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const initGenRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    const gen = ++initGenRef.current;

    void (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || gen !== initGenRef.current || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      containerRef.current.innerHTML = "";

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        attributionControl: true,
      });
      map.attributionControl.setPrefix(false);

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTR,
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      const icon = L.divIcon({
        className: "warka-map-pin",
        html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2d5016" stroke="#fff" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      L.marker([latitude, longitude], { icon, interactive: false }).addTo(map);

      mapRef.current = map;
      requestAnimationFrame(() => map.invalidateSize({ animate: false }));
      window.setTimeout(() => {
        if (!cancelled && gen === initGenRef.current && mapRef.current) {
          mapRef.current.invalidateSize({ animate: false });
        }
      }, 200);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [latitude, longitude]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-warka-border/60 bg-warka-bg",
        className
      )}
    >
      <div ref={containerRef} className="h-36 w-full sm:h-40" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-3 py-2">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-white">
          <MapPin className="size-3.5 shrink-0" />
          {isAr ? "موقع التوصيل المحدّد" : "Selected delivery point"}
        </p>
      </div>
    </div>
  );
}
