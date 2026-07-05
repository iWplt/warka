import type {
  ColorSource,
  CustomizationPayload,
  CustomizationZone,
  EmbroideryColor,
  EmbroiderySizeRule,
  ProductStyle,
  ZoneColorOption,
  ZoneSelection,
} from "@/types/customization";

export function zonesForStyle(
  zones: CustomizationZone[],
  styleId: string | null
): CustomizationZone[] {
  return zones
    .filter((z) => !z.style_id || z.style_id === styleId)
    .filter((z) => z.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function computeEmbroiderySizeMm(
  text: string,
  rules: EmbroiderySizeRule[]
): number | null {
  const len = text.trim().length;
  if (len === 0) return null;

  const sorted = [...rules].sort((a, b) => a.sort_order - b.sort_order);
  for (const rule of sorted) {
    if (len >= rule.min_chars && len <= rule.max_chars) {
      return Number(rule.embroidery_size_mm);
    }
  }

  const last = sorted[sorted.length - 1];
  return last ? Number(last.embroidery_size_mm) : null;
}

export function resolveZoneColorHex(options: {
  colorSource: ColorSource;
  sashColorHex?: string | null;
  selectedColorId?: string | null;
  embroideryColors: EmbroideryColor[];
  fixedHex?: string | null;
}): string | null {
  const { colorSource, sashColorHex, selectedColorId, embroideryColors, fixedHex } = options;

  if (colorSource === "match_sash_color" && sashColorHex) return sashColorHex;
  if (colorSource === "fixed" && fixedHex) return fixedHex;

  if (selectedColorId) {
    const c = embroideryColors.find((x) => x.id === selectedColorId);
    if (c?.hex_code) return c.hex_code;
  }

  return sashColorHex ?? "#C9A227";
}

export function primaryColorSourceForZone(
  zoneId: string,
  zoneColorOptions: ZoneColorOption[]
): ColorSource {
  const opts = zoneColorOptions.filter((o) => o.zone_id === zoneId);
  if (opts.some((o) => o.color_source === "match_sash_color")) return "match_sash_color";
  if (opts.some((o) => o.color_source === "fixed")) return "fixed";
  return "selectable";
}

export function buildEmptyZoneSelections(zones: CustomizationZone[]): ZoneSelection[] {
  return zones.map((z) => ({
    zone_id: z.id,
    zone_key: z.zone_key,
    zone_label_ar: z.zone_label_ar,
    content_type: z.content_type,
    text_value: "",
  }));
}

export function updateZoneSelection(
  selections: ZoneSelection[],
  zoneId: string,
  patch: Partial<ZoneSelection>
): ZoneSelection[] {
  const exists = selections.some((s) => s.zone_id === zoneId);
  if (!exists) {
    return [
      ...selections,
      {
        zone_id: zoneId,
        zone_key: patch.zone_key ?? zoneId,
        content_type: patch.content_type ?? "custom_text",
        ...patch,
      } as ZoneSelection,
    ];
  }
  return selections.map((s) => (s.zone_id === zoneId ? { ...s, ...patch } : s));
}

export function validateRequiredZones(
  zones: CustomizationZone[],
  selections: ZoneSelection[]
): string[] {
  const missing: string[] = [];
  for (const zone of zones.filter((z) => z.is_required)) {
    const sel = selections.find((s) => s.zone_id === zone.id);
    const hasText = Boolean(sel?.text_value?.trim() || sel?.text_library_id);
    const hasImage = Boolean(sel?.image_data_url || sel?.option_id);
    if (!hasText && !hasImage) missing.push(zone.zone_label_ar);
  }
  return missing;
}

export function filterStylesForBatch(
  styles: ProductStyle[],
  isBatchStudent: boolean
): ProductStyle[] {
  return styles.filter((s) => s.is_active && (isBatchStudent || !s.is_batch_locked));
}

export function primaryNameFromPayload(payload: CustomizationPayload): string {
  const nameZone = payload.zones.find(
    (z) =>
      z.content_type === "name_major" ||
      z.zone_key === "left_front" ||
      z.zone_key === "side_band"
  );
  return nameZone?.text_value?.trim() ?? "";
}

export function profileHasEngine(profile: ProductCustomizationProfile | null | undefined): boolean {
  return Boolean(profile && (profile.zones.length > 0 || profile.styles.length > 0));
}
