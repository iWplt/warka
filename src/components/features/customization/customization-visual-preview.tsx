"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Expand, Palette } from "lucide-react";
import { OptionPreviewModal } from "@/components/features/customization/option-preview-modal";
import { zoneOverlayLayout } from "@/lib/customization/preview-layout";
import { resolveZoneColorHex, primaryColorSourceForZone } from "@/lib/customization/engine";
import type { CustomizationPayload, ProductCustomizationProfile } from "@/types/customization";
import type { ProductType } from "@/types/database";
import { cn } from "@/lib/utils";

type CustomizationVisualPreviewProps = {
  baseImage: string;
  productType: ProductType;
  profile: ProductCustomizationProfile;
  customization: CustomizationPayload;
  sashColorHex?: string | null;
  fontFamily?: string;
  locale: "ar" | "en";
  className?: string;
  /** Smaller preview for modals — keeps controls visible on mobile */
  variant?: "default" | "studio";
};

export function CustomizationVisualPreview({
  baseImage,
  productType,
  profile,
  customization,
  sashColorHex,
  fontFamily = "Cairo, sans-serif",
  locale,
  className,
  variant = "default",
}: CustomizationVisualPreviewProps) {
  const isAr = locale === "ar";
  const isStudio = variant === "studio";
  const [fullscreen, setFullscreen] = useState(false);

  const activeStyle = profile.styles.find((s) => s.id === customization.style_id);
  const displayBase =
    activeStyle?.preview_image_url?.trim() || baseImage;

  const zoneOverlays = useMemo(() => {
    return customization.zones
      .filter((z) => z.text_value?.trim() || z.image_data_url || z.option_id)
      .map((sel) => {
        const zone = profile.zones.find((z) => z.id === sel.zone_id);
        if (!zone) return null;
        const layout = zoneOverlayLayout(productType, zone.zone_key);
        const colorSource = primaryColorSourceForZone(zone.id, profile.zone_colors);
        const threadColor =
          sel.color_hex ??
          resolveZoneColorHex({
            colorSource,
            sashColorHex,
            selectedColorId: sel.color_id,
            embroideryColors: profile.embroidery_colors,
          }) ??
          sashColorHex ??
          "#C9A227";

        const patternOpt = sel.option_id
          ? profile.options.find((o) => o.id === sel.option_id)
          : null;

        return {
          key: zone.zone_key,
          text: sel.text_value?.trim() ?? "",
          patternUrl: patternOpt?.preview_image_url ?? sel.image_data_url ?? null,
          layout,
          threadColor,
          vertical: layout.vertical,
        };
      })
      .filter(Boolean);
  }, [customization, profile, productType, sashColorHex]);

  const previewBody = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-media-bg shadow-inner",
        isStudio
          ? "mx-auto max-h-[min(26dvh,200px)] aspect-[5/4] sm:max-h-[min(32dvh,260px)] lg:max-h-none lg:aspect-[4/5]"
          : "aspect-[4/5]"
      )}
    >
      <Image
        src={displayBase}
        alt={isAr ? "معاينة المنتج" : "Product preview"}
        fill
        className={cn(
          "transition-opacity duration-300",
          isStudio ? "object-contain p-1" : "object-cover"
        )}
        sizes="(max-width: 768px) 100vw, 400px"
        priority
        unoptimized={displayBase.startsWith("data:")}
      />

      {sashColorHex && (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.12]"
          style={{ backgroundColor: sashColorHex }}
          aria-hidden
        />
      )}

      {zoneOverlays.map((layer) =>
        layer ? (
          <div
            key={layer.key}
            className="pointer-events-none absolute"
            style={{
              top: layer.layout.top,
              left: layer.layout.left,
              width: layer.layout.width,
              textAlign: layer.layout.textAlign,
            }}
          >
            {layer.patternUrl && (
              <div className="relative mx-auto mb-1 size-8 sm:size-10">
                <Image
                  src={layer.patternUrl}
                  alt=""
                  fill
                  className="object-contain drop-shadow"
                  unoptimized={layer.patternUrl.startsWith("data:")}
                />
              </div>
            )}
            {layer.text && (
              <p
                className={cn(
                  "font-semibold leading-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]",
                  layer.vertical && "mx-auto inline-block [writing-mode:vertical-rl] rotate-180"
                )}
                style={{
                  color: layer.threadColor,
                  fontFamily,
                  fontSize: layer.layout.fontSize,
                }}
                dir="auto"
              >
                {layer.text}
              </p>
            )}
          </div>
        ) : null
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 pb-3 pt-8">
        <p className="text-[10px] font-medium text-white/90 sm:text-xs">
          {isAr ? "معاينة تقريبية — النتيجة النهائية قد تختلف قليلاً" : "Approximate preview — final may vary slightly"}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {!isStudio && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-warka-text">
              {isAr ? "معاينة اللون والتطريز" : "Color & embroidery preview"}
            </p>
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-warka-border bg-card px-2.5 py-1.5 text-xs font-medium text-warka-primary hover:bg-warka-bg"
            >
              <Expand className="size-3.5" />
              {isAr ? "تكبير" : "Expand"}
            </button>
          </div>
        )}

        {isStudio && (
          <div className="flex items-center justify-between gap-2 px-0.5">
            <p className="text-xs font-semibold text-warka-text">
              {isAr ? "معاينة مباشرة" : "Live preview"}
            </p>
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-warka-primary hover:bg-warka-bg"
            >
              <Expand className="size-3" />
              {isAr ? "تكبير" : "Expand"}
            </button>
          </div>
        )}

        {previewBody}

        {!isStudio && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-warka-text-secondary">
          <Palette className="size-3.5 shrink-0 text-warka-primary" />
          {activeStyle && (
            <span className="rounded-full bg-warka-bg px-2 py-0.5">
              {isAr ? activeStyle.style_name_ar : activeStyle.style_name_en ?? activeStyle.style_name_ar}
            </span>
          )}
          {sashColorHex && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warka-bg px-2 py-0.5">
              <span className="size-3 rounded-full border" style={{ backgroundColor: sashColorHex }} />
              {isAr ? "لون الوشاح" : "Sash color"}
            </span>
          )}
        </div>
        )}
      </div>

      <OptionPreviewModal
        open={fullscreen}
        onOpenChange={setFullscreen}
        title={isAr ? "معاينة كاملة" : "Full preview"}
        imageUrl={displayBase}
        locale={locale}
      />
    </>
  );
}
