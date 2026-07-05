"use client";

import { useMemo } from "react";
import { Ruler, Palette, Layers } from "lucide-react";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { Label } from "@/components/ui/label";
import { EmbroideryLivePreview } from "@/components/features/embroidery/embroidery-live-preview";
import { DecorationUploadField } from "@/components/features/embroidery/decoration-upload-field";
import {
  computeEmbroiderySizeMm,
  filterStylesForBatch,
  primaryColorSourceForZone,
  resolveZoneColorHex,
  zonesForStyle,
} from "@/lib/customization/engine";
import type {
  CustomizationPayload,
  CustomizationZone,
  ProductCustomizationProfile,
  ZoneSelection,
} from "@/types/customization";
import { VisualOptionPicker } from "@/components/features/customization/visual-option-picker";
import { cn } from "@/lib/utils";

type ProductCustomizationEngineProps = {
  profile: ProductCustomizationProfile;
  locale: "ar" | "en";
  value: CustomizationPayload;
  onChange: (payload: CustomizationPayload) => void;
  sashColorHex?: string | null;
  fontFamily?: string;
  isBatchStudent?: boolean;
  className?: string;
};

export function ProductCustomizationEngine({
  profile,
  locale,
  value,
  onChange,
  sashColorHex,
  fontFamily = "Cairo, sans-serif",
  isBatchStudent = false,
  className,
}: ProductCustomizationEngineProps) {
  const isAr = locale === "ar";
  const styles = useMemo(
    () => filterStylesForBatch(profile.styles, isBatchStudent),
    [profile.styles, isBatchStudent]
  );

  const activeStyleId = value.style_id ?? styles[0]?.id ?? null;
  const activeZones = useMemo(
    () => zonesForStyle(profile.zones, activeStyleId),
    [profile.zones, activeStyleId]
  );

  const setStyle = (styleId: string) => {
    const style = styles.find((s) => s.id === styleId);
    const zones = zonesForStyle(profile.zones, styleId);
    onChange({
      ...value,
      style_id: styleId,
      style_key: style?.style_key,
      style_name_ar: style?.style_name_ar,
      zones: zones.map((z) => ({
        zone_id: z.id,
        zone_key: z.zone_key,
        zone_label_ar: z.zone_label_ar,
        content_type: z.content_type,
        text_value: "",
      })),
    });
  };

  const patchZone = (zone: CustomizationZone, patch: Partial<ZoneSelection>) => {
    const existing = value.zones.find((s) => s.zone_id === zone.id);
    const textForSize = patch.text_value ?? existing?.text_value ?? "";
    const rules = profile.size_rules.filter((r) => r.zone_id === zone.id);
    const computed_size_mm = computeEmbroiderySizeMm(textForSize, rules) ?? undefined;
    const colorSource = primaryColorSourceForZone(zone.id, profile.zone_colors);
    const color_hex = resolveZoneColorHex({
      colorSource,
      sashColorHex,
      selectedColorId: patch.color_id ?? existing?.color_id,
      embroideryColors: profile.embroidery_colors,
    });

    const nextZones = value.zones.some((s) => s.zone_id === zone.id)
      ? value.zones.map((s) =>
          s.zone_id === zone.id
            ? { ...s, ...patch, computed_size_mm, color_source: colorSource, color_hex: color_hex ?? undefined }
            : s
        )
      : [
          ...value.zones,
          {
            zone_id: zone.id,
            zone_key: zone.zone_key,
            zone_label_ar: zone.zone_label_ar,
            content_type: zone.content_type,
            ...patch,
            computed_size_mm,
            color_source: colorSource,
            color_hex: color_hex ?? undefined,
          },
        ];

    onChange({ ...value, zones: nextZones });
  };

  const toggleGownAddition = (additionId: string) => {
    const current = value.gown_additions ?? [];
    onChange({
      ...value,
      gown_additions: current.includes(additionId)
        ? current.filter((id) => id !== additionId)
        : [...current, additionId],
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {styles.length > 0 && (
        <WarkaCard>
          <WarkaCardTitle className="mb-3 flex items-center gap-2">
            <Layers className="size-4 text-warka-primary" />
            {isAr ? "اختر شكل المنتج" : "Choose product style"}
          </WarkaCardTitle>
          <VisualOptionPicker
            label={isAr ? "اضغط للمعاينة ثم الاختيار" : "Tap to preview, then select"}
            locale={locale}
            selectedId={activeStyleId}
            onSelect={setStyle}
            columns={2}
            options={styles.map((style) => ({
              id: style.id,
              label: isAr ? style.style_name_ar : style.style_name_en ?? style.style_name_ar,
              previewUrl: style.preview_image_url,
              subtitle: isAr ? style.description_ar ?? undefined : style.description_en ?? style.description_ar ?? undefined,
            }))}
          />
        </WarkaCard>
      )}

      {activeZones.map((zone) => (
        <ZoneEditor
          key={zone.id}
          zone={zone}
          locale={locale}
          selection={value.zones.find((s) => s.zone_id === zone.id)}
          profile={profile}
          sashColorHex={sashColorHex}
          fontFamily={fontFamily}
          onPatch={(patch) => patchZone(zone, patch)}
        />
      ))}

      {profile.gown_additions.length > 0 && (
        <WarkaCard>
          <WarkaCardTitle className="mb-3">{isAr ? "إضافات الروب" : "Gown additions"}</WarkaCardTitle>
          <div className="flex flex-wrap gap-2">
            {profile.gown_additions.map((add) => {
              const checked = (value.gown_additions ?? []).includes(add.id);
              return (
                <button
                  key={add.id}
                  type="button"
                  onClick={() => toggleGownAddition(add.id)}
                  className={cn(
                    "rounded-[10px] border px-3 py-2 text-xs font-medium",
                    checked ? "border-warka-primary bg-warka-primary text-white" : "border-warka-border bg-card"
                  )}
                >
                  {isAr ? add.addition_name_ar : add.addition_name_en ?? add.addition_name_ar}
                </button>
              );
            })}
          </div>
        </WarkaCard>
      )}
    </div>
  );
}

function ZoneEditor({
  zone,
  locale,
  selection,
  profile,
  sashColorHex,
  fontFamily,
  onPatch,
}: {
  zone: CustomizationZone;
  locale: "ar" | "en";
  selection?: ZoneSelection;
  profile: ProductCustomizationProfile;
  sashColorHex?: string | null;
  fontFamily: string;
  onPatch: (patch: Partial<ZoneSelection>) => void;
}) {
  const isAr = locale === "ar";
  const zoneOptions = profile.options.filter((o) => o.zone_id === zone.id);
  const modeOptions = zoneOptions.filter((o) => o.option_key?.startsWith("mode_"));
  const patternOptions = zoneOptions.filter((o) => o.option_type === "preset_pattern");
  const activeMode = modeOptions.find((o) => o.id === selection?.option_id)?.option_key;
  const colorSource = primaryColorSourceForZone(zone.id, profile.zone_colors);
  const resolvedColor =
    selection?.color_hex ??
    resolveZoneColorHex({
      colorSource,
      sashColorHex,
      selectedColorId: selection?.color_id,
      embroideryColors: profile.embroidery_colors,
    });
  const displayText = selection?.text_value ?? "";

  return (
    <WarkaCard className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <WarkaCardTitle className="text-base">
          {isAr ? zone.zone_label_ar : zone.zone_label_en ?? zone.zone_label_ar}
          {zone.is_required && <span className="ms-1 text-destructive">*</span>}
        </WarkaCardTitle>
        {selection?.computed_size_mm != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warka-bg px-2.5 py-1 text-[11px] font-semibold">
            <Ruler className="size-3" />
            {selection.computed_size_mm} mm
          </span>
        )}
      </div>

      {(zone.content_type === "name_major" || zone.content_type === "university_info") && (
        <>
          {zone.zone_key === "right_front" && modeOptions.length > 0 && (
            <>
              <Label>{isAr ? "ماذا تريد على اليمين؟" : "Right side content"}</Label>
              <div className="flex flex-wrap gap-2">
                {modeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onPatch({
                        option_id: opt.id,
                        option_type: opt.option_type,
                        text_value: "",
                        image_data_url: undefined,
                      })
                    }
                    className={cn(
                      "rounded-xl border-2 px-3 py-2 text-xs font-medium",
                      selection?.option_id === opt.id
                        ? "border-warka-primary bg-warka-primary/10"
                        : "border-warka-border"
                    )}
                  >
                    {isAr ? opt.option_name_ar : opt.option_name_en ?? opt.option_name_ar}
                  </button>
                ))}
              </div>
            </>
          )}

          {zone.zone_key === "right_front" && activeMode === "mode_year" && (
            <>
              <Label>{isAr ? "سنة التخرج (بالطول)" : "Graduation year (vertical)"}</Label>
              <input
                value={displayText}
                maxLength={4}
                placeholder={isAr ? "2026" : "2026"}
                onChange={(e) =>
                  onPatch({ text_value: e.target.value, content_type: zone.content_type })
                }
                className="warka-input max-w-[8rem] text-center tracking-widest"
                dir="ltr"
              />
            </>
          )}

          {zone.zone_key === "right_front" && activeMode === "mode_university" && (
            <>
              <Label>{isAr ? "قسم / جامعة / Class of / سنة" : "Dept / university / Class of / year"}</Label>
              <textarea
                value={displayText}
                rows={3}
                maxLength={zone.max_chars ?? undefined}
                placeholder={
                  isAr
                    ? "مثال: كلية الهندسة — جامعة بغداد\nClass of 2026"
                    : "e.g. Engineering — University of Baghdad\nClass of 2026"
                }
                onChange={(e) =>
                  onPatch({ text_value: e.target.value, content_type: zone.content_type })
                }
                className="w-full rounded-xl border border-warka-border px-3 py-2 text-sm"
                dir="auto"
              />
              <DecorationUploadField
                imageUrl={selection?.image_data_url ?? null}
                onChange={(url) => onPatch({ image_data_url: url ?? undefined, option_type: "logo_upload" })}
                locale={locale}
                label={isAr ? "لوغو القسم أو الجامعة" : "Department or university logo"}
              />
            </>
          )}

          {!(zone.zone_key === "right_front" && modeOptions.length > 0) && (
            <>
              <Label>
                {zone.content_type === "name_major"
                  ? isAr
                    ? "الاسم + الاختصاص"
                    : "Name + major"
                  : isAr
                    ? "النص"
                    : "Text"}
              </Label>
              <input
                value={displayText}
                maxLength={zone.max_chars ?? undefined}
                placeholder={
                  zone.zone_key === "side_band"
                    ? isAr
                      ? "مثال: نور محمد"
                      : "e.g. Noor Mohammed"
                    : undefined
                }
                onChange={(e) =>
                  onPatch({ text_value: e.target.value, content_type: zone.content_type })
                }
                className="warka-input"
                dir="auto"
              />
              {zone.content_type === "name_major" && displayText && (
                <EmbroideryLivePreview
                  baseName={displayText}
                  diacriticsMode="auto"
                  fontFamily={fontFamily}
                  locale={locale}
                  embedded
                />
              )}
            </>
          )}

          {zone.allows_multiple && patternOptions.length > 0 && (
            <VisualOptionPicker
              label={isAr ? "نقشة بسيطة (اضغط 👁 للمعاينة)" : "Small pattern (tap eye to preview)"}
              locale={locale}
              selectedId={selection?.option_id ?? null}
              onSelect={(id) => {
                const opt = patternOptions.find((o) => o.id === id);
                if (opt) onPatch({ option_id: opt.id, option_type: opt.option_type });
              }}
              columns={3}
              options={patternOptions.map((opt) => ({
                id: opt.id,
                label: isAr ? opt.option_name_ar : opt.option_name_en ?? opt.option_name_ar,
                previewUrl: opt.preview_image_url,
              }))}
            />
          )}
        </>
      )}

      {zone.content_type === "university_info" && zone.zone_key !== "right_front" && (
        <>
          <Label>{isAr ? "معلومات الجامعة" : "University info"}</Label>
          <textarea
            value={displayText}
            rows={3}
            maxLength={zone.max_chars ?? undefined}
            onChange={(e) => onPatch({ text_value: e.target.value, content_type: zone.content_type })}
            className="w-full rounded-xl border border-warka-border px-3 py-2 text-sm"
            dir="auto"
          />
        </>
      )}

      {zone.content_type !== "name_major" &&
        zone.content_type !== "university_info" &&
        zone.content_type === "text_library" && (
        <>
          <Label>{isAr ? "نص جاهز" : "Preset text"}</Label>
          <select
            className="warka-input"
            value={selection?.text_library_id ?? ""}
            onChange={(e) => {
              const entry = profile.text_library.find((t) => t.id === e.target.value);
              onPatch({
                text_library_id: e.target.value || undefined,
                text_value: entry?.content_ar ?? "",
                content_type: zone.content_type,
              });
            }}
          >
            <option value="">{isAr ? "— نص مخصص —" : "— custom —"}</option>
            {profile.text_library.map((t) => (
              <option key={t.id} value={t.id}>
                {t.content_ar}
              </option>
            ))}
          </select>
          <textarea
            value={displayText}
            rows={2}
            maxLength={zone.max_chars ?? undefined}
            onChange={(e) =>
              onPatch({ text_value: e.target.value, text_library_id: undefined, content_type: zone.content_type })
            }
            className="w-full rounded-xl border border-warka-border px-3 py-2 text-sm"
            dir="auto"
          />
        </>
      )}

      {zoneOptions.filter((o) => o.option_type === "preset_pattern").length > 0 &&
        !(zone.allows_multiple && patternOptions.length > 0) && (
        <VisualOptionPicker
          locale={locale}
          selectedId={selection?.option_id ?? null}
          onSelect={(id) => {
            const opt = zoneOptions.find((o) => o.id === id);
            if (opt) onPatch({ option_id: opt.id, option_type: opt.option_type });
          }}
          columns={3}
          options={zoneOptions
            .filter((o) => o.option_type === "preset_pattern")
            .map((opt) => ({
              id: opt.id,
              label: isAr ? opt.option_name_ar : opt.option_name_en ?? opt.option_name_ar,
              previewUrl: opt.preview_image_url,
            }))}
        />
      )}

      {zoneOptions.some((o) => o.option_type === "logo_upload") && (
        <DecorationUploadField
          imageUrl={selection?.image_data_url ?? null}
          onChange={(url) => onPatch({ image_data_url: url ?? undefined, option_type: "logo_upload" })}
          locale={locale}
          label={isAr ? "رفع شعار" : "Upload logo"}
        />
      )}

      <div className="flex items-center gap-2 border-t border-warka-border pt-3 text-sm">
        <Palette className="size-4 text-warka-primary" />
        {colorSource === "match_sash_color" ? (
          <>
            <span className="size-6 rounded-full border" style={{ backgroundColor: resolvedColor ?? "#ccc" }} />
            <span>{isAr ? "مطابق للوشاح" : "Matches sash"}</span>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.embroidery_colors.map((c) => (
              <button
                key={c.id}
                type="button"
                title={isAr ? c.color_name_ar : c.color_name_en ?? c.color_name_ar}
                onClick={() => onPatch({ color_id: c.id })}
                className={cn(
                  "size-9 rounded-full border-2 transition-transform hover:scale-110",
                  selection?.color_id === c.id ? "border-warka-primary ring-2 ring-warka-primary/30" : "border-warka-border"
                )}
                style={{ backgroundColor: c.hex_code ?? "#ccc" }}
              />
            ))}
          </div>
        )}
      </div>
    </WarkaCard>
  );
}
