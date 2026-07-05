import type { ProductType } from "@/types/database";

export type ZoneOverlayLayout = {
  top: string;
  left: string;
  width: string;
  textAlign: "center" | "start" | "end";
  fontSize?: string;
  vertical?: boolean;
};

const SASH_ZONES: Record<string, ZoneOverlayLayout> = {
  left_front: { top: "38%", left: "6%", width: "30%", textAlign: "start", fontSize: "clamp(0.55rem, 2.2vw, 0.85rem)" },
  right_front: { top: "32%", left: "62%", width: "30%", textAlign: "end", fontSize: "clamp(0.5rem, 2vw, 0.75rem)", vertical: true },
  back: { top: "58%", left: "22%", width: "56%", textAlign: "center", fontSize: "clamp(0.45rem, 1.8vw, 0.7rem)" },
};

const CAP_ZONES: Record<string, ZoneOverlayLayout> = {
  side_band: { top: "72%", left: "8%", width: "84%", textAlign: "center", fontSize: "clamp(0.5rem, 2vw, 0.8rem)" },
  top: { top: "22%", left: "28%", width: "44%", textAlign: "center", fontSize: "clamp(0.45rem, 1.6vw, 0.65rem)" },
};

export function zoneOverlayLayout(
  productType: ProductType,
  zoneKey: string
): ZoneOverlayLayout {
  const map = productType === "cap" ? CAP_ZONES : SASH_ZONES;
  return (
    map[zoneKey] ?? {
      top: "45%",
      left: "25%",
      width: "50%",
      textAlign: "center",
      fontSize: "0.75rem",
    }
  );
}
