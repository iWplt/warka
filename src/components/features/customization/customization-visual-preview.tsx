"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import { OptionPreviewModal } from "@/components/features/customization/option-preview-modal";
import { resolveCatalogPreview } from "@/lib/customization/engine";
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

/**
 * Shows admin-uploaded catalog images for the selected style / pattern / decoration.
 * Caption lives under the image (no overlapping overlay text).
 */
export function CustomizationVisualPreview({
  baseImage,
  profile,
  customization,
  locale,
  className,
  variant = "default",
}: CustomizationVisualPreviewProps) {
  const isAr = locale === "ar";
  const isStudio = variant === "studio";
  const [fullscreen, setFullscreen] = useState(false);
  const [focusChipId, setFocusChipId] = useState<string | null>(null);

  const { heroImage, chips } = useMemo(
    () => resolveCatalogPreview(profile, customization, baseImage, locale),
    [profile, customization, baseImage, locale]
  );

  const focused = focusChipId ? chips.find((c) => c.id === focusChipId) : null;
  const displayImage = focused?.imageUrl ?? heroImage;
  const activeStyle = profile.styles.find((s) => s.id === customization.style_id);
  const caption =
    focused?.label ??
    (activeStyle
      ? isAr
        ? activeStyle.style_name_ar
        : activeStyle.style_name_en ?? activeStyle.style_name_ar
      : isAr
        ? "صورة المنتج"
        : "Product image");

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 text-sm font-bold leading-snug text-warka-text">
            {isAr ? "صورة الشكل والزخرفة" : "Style & decoration image"}
          </p>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-warka-border bg-card px-2.5 py-1.5 text-xs font-medium text-warka-primary hover:bg-warka-bg"
          >
            <Expand className="size-3.5" />
            {isAr ? "تكبير" : "Expand"}
          </button>
        </div>

        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl border border-warka-border/60 bg-media-bg",
            isStudio
              ? "mx-auto aspect-[5/4] max-h-[min(30dvh,240px)] sm:max-h-[min(36dvh,280px)] lg:max-h-none lg:aspect-[4/5]"
              : "aspect-[4/5] max-h-[min(56dvh,480px)] sm:max-h-none"
          )}
        >
          <Image
            src={displayImage}
            alt={caption}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, 400px"
            priority
            unoptimized={displayImage.startsWith("data:")}
          />
        </div>

        <div className="space-y-0.5 px-0.5">
          <p className="text-sm font-semibold leading-snug text-warka-text">{caption}</p>
          <p className="text-xs leading-relaxed text-warka-text-muted">
            {isAr ? "صورة المتجر لهذا الخيار" : "Store photo for this option"}
          </p>
        </div>

        {chips.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {chips.map((chip) => {
              const active = (focused?.id ?? chips[chips.length - 1]?.id) === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFocusChipId(chip.id)}
                  className={cn(
                    "flex max-w-[7.5rem] shrink-0 flex-col overflow-hidden rounded-xl border-2 bg-card text-start",
                    active
                      ? "border-warka-primary"
                      : "border-warka-border hover:border-warka-primary/40"
                  )}
                >
                  <div className="relative aspect-square w-16 bg-media-bg sm:w-20">
                    <Image
                      src={chip.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized={chip.imageUrl.startsWith("data:")}
                    />
                  </div>
                  <span className="line-clamp-2 px-1.5 py-1 text-[10px] font-medium leading-tight text-warka-text">
                    {chip.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <OptionPreviewModal
        open={fullscreen}
        onOpenChange={setFullscreen}
        title={caption}
        imageUrl={displayImage}
        locale={locale}
      />
    </>
  );
}
