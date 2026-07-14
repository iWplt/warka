"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Expand, ImageIcon } from "lucide-react";
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
 * Does NOT overlay live embroidery text (that preview was inaccurate).
 */
export function CustomizationVisualPreview({
  baseImage,
  profile,
  customization,
  sashColorHex,
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

  const previewBody = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-media-bg shadow-inner",
        isStudio
          ? "mx-auto max-h-[min(28dvh,220px)] aspect-[5/4] sm:max-h-[min(34dvh,280px)] lg:max-h-none lg:aspect-[4/5]"
          : "aspect-[4/5]"
      )}
    >
      <Image
        src={displayImage}
        alt={focused?.label ?? (isAr ? "صورة المنتج / الخيار" : "Product / option image")}
        fill
        className={cn(
          "transition-opacity duration-300",
          isStudio ? "object-contain p-1.5" : "object-contain p-2 sm:object-cover sm:p-0"
        )}
        sizes="(max-width: 768px) 100vw, 400px"
        priority
        unoptimized={displayImage.startsWith("data:")}
      />

      {sashColorHex && (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.08]"
          style={{ backgroundColor: sashColorHex }}
          aria-hidden
        />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-3 pt-10">
        <p className="text-[11px] font-medium leading-snug text-white/95 sm:text-xs">
          {focused?.label ??
            (activeStyle
              ? isAr
                ? activeStyle.style_name_ar
                : activeStyle.style_name_en ?? activeStyle.style_name_ar
              : isAr
                ? "صورة المنتج"
                : "Product image")}
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-white/75">
          {isAr
            ? "صورة مرفوعة من المتجر لهذا الخيار — مو معاينة حية"
            : "Store image for this option — not a live embroidery mockup"}
        </p>
      </div>
    </div>
  );

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

        {previewBody}

        {chips.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-warka-text-secondary">
              {isAr ? "الخيارات المختارة (اضغط للعرض)" : "Selected options (tap to view)"}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {chips.map((chip) => {
                const active = (focused?.id ?? chips[chips.length - 1]?.id) === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFocusChipId(chip.id)}
                    className={cn(
                      "flex w-[5.5rem] shrink-0 flex-col overflow-hidden rounded-xl border-2 bg-card text-start transition-colors",
                      active
                        ? "border-warka-primary ring-2 ring-warka-primary/20"
                        : "border-warka-border hover:border-warka-primary/40"
                    )}
                  >
                    <div className="relative aspect-square bg-media-bg">
                      <Image
                        src={chip.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="88px"
                        unoptimized={chip.imageUrl.startsWith("data:")}
                      />
                    </div>
                    <span className="line-clamp-2 min-h-[2.25rem] px-1.5 py-1.5 text-[10px] font-medium leading-tight text-warka-text">
                      {chip.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {chips.length === 0 && (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-warka-text-muted">
            <ImageIcon className="mt-0.5 size-3.5 shrink-0 text-warka-primary" />
            {isAr
              ? "اختر شكلاً أو زخرفة من الاستوديو — تظهر هنا صورة الأدمن لكل خيار."
              : "Pick a style or decoration in the studio — each admin image appears here."}
          </p>
        )}
      </div>

      <OptionPreviewModal
        open={fullscreen}
        onOpenChange={setFullscreen}
        title={focused?.label ?? (isAr ? "معاينة الصورة" : "Image preview")}
        imageUrl={displayImage}
        locale={locale}
      />
    </>
  );
}
