"use client";

import { useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Palette, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomizationVisualPreview } from "@/components/features/customization/customization-visual-preview";
import { ProductCustomizationEngine } from "@/components/features/customization/product-customization-engine";
import { CustomizationExtras } from "@/components/features/customization/customization-extras";
import { FontPickerTrigger } from "@/components/features/embroidery/font-picker-popup";
import type { CustomizationPayload, ProductCustomizationProfile } from "@/types/customization";
import type { ProductType } from "@/types/database";
import type { WarkaFont } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

type CustomizationStudioModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "ar" | "en";
  productType: ProductType;
  baseImage: string;
  profile: ProductCustomizationProfile;
  customization: CustomizationPayload;
  onCustomizationChange: (payload: CustomizationPayload) => void;
  sashColorHex?: string | null;
  fonts: WarkaFont[];
  selectedFont: string | null;
  onFontChange: (fontFamily: string) => void;
  displayName: string;
  decorationUrl: string | null;
  onDecorationChange: (url: string | null) => void;
  capSideUrl?: string | null;
  capTopUrl?: string | null;
  onCapSideChange?: (url: string | null) => void;
  onCapTopChange?: (url: string | null) => void;
  showCustomReference?: boolean;
  customReferenceUrl?: string | null;
  onCustomReferenceChange?: (url: string | null) => void;
  isBatchStudent?: boolean;
};

export function CustomizationStudioModal({
  open,
  onOpenChange,
  locale,
  productType,
  baseImage,
  profile,
  customization,
  onCustomizationChange,
  sashColorHex,
  fonts,
  selectedFont,
  onFontChange,
  displayName,
  decorationUrl,
  onDecorationChange,
  capSideUrl,
  capTopUrl,
  onCapSideChange,
  onCapTopChange,
  showCustomReference,
  customReferenceUrl,
  onCustomReferenceChange,
  isBatchStudent = false,
}: CustomizationStudioModalProps) {
  const isAr = locale === "ar";

  const filledZones = useMemo(
    () =>
      customization.zones.filter(
        (z) => z.text_value?.trim() || z.option_id || z.image_data_url
      ).length,
    [customization.zones]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-warka-text/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed z-[81] flex flex-col overflow-hidden border border-warka-border bg-card text-warka-text shadow-tint-lg outline-none",
            "inset-0 h-[100dvh] max-h-[100dvh] w-full max-w-none rounded-none",
            "sm:inset-x-4 sm:top-[3dvh] sm:bottom-auto sm:h-auto sm:max-h-[94dvh] sm:w-[calc(100%-2rem)] sm:max-w-4xl sm:rounded-2xl sm:start-1/2 sm:-translate-x-1/2"
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-warka-border/50 bg-warka-primary/5 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warka-primary/15 text-warka-primary">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <Dialog.Title className="truncate text-base font-bold text-warka-text">
                  {isAr ? "استوديو التخصيص والتطريز" : "Customization & embroidery studio"}
                </Dialog.Title>
                <p className="text-xs text-warka-text-muted">
                  {isAr
                    ? "المعاينة ثابتة فوق — عدّل كل الخيارات من مكان واحد"
                    : "Preview stays on top — edit everything in one place"}
                </p>
              </div>
            </div>
            <Dialog.Close
              className="flex size-10 shrink-0 touch-manipulation items-center justify-center rounded-full border border-warka-border/60 text-warka-text-muted transition-colors hover:border-warka-primary/40 hover:bg-warka-bg hover:text-warka-text"
              aria-label={isAr ? "إغلاق" : "Close"}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="shrink-0 border-b border-warka-border/40 bg-warka-bg/40 px-3 py-3 sm:px-4">
            <CustomizationVisualPreview
              baseImage={baseImage}
              productType={productType}
              profile={profile}
              customization={customization}
              sashColorHex={sashColorHex}
              fontFamily={selectedFont ?? "Cairo, sans-serif"}
              locale={locale}
              className="mx-auto max-w-md"
            />
            <p className="mt-2 text-center text-[11px] text-warka-text-muted">
              {isAr
                ? "تتغير المعاينة مباشرة عند اختيار الشكل أو النقشة أو النص"
                : "Preview updates live when you change style, pattern, or text"}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 [-webkit-overflow-scrolling:touch]">
            <div className="space-y-4">
              <ProductCustomizationEngine
                profile={profile}
                locale={locale}
                value={customization}
                onChange={onCustomizationChange}
                sashColorHex={sashColorHex}
                fontFamily={selectedFont ?? "Cairo, sans-serif"}
                isBatchStudent={isBatchStudent}
              />

              {fonts.length > 0 && (
                <div className="rounded-2xl border border-warka-border bg-card p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-warka-text">
                    <Palette className="size-4 text-warka-primary" />
                    {isAr ? "خط التطريز" : "Embroidery font"}
                  </p>
                  <FontPickerTrigger
                    fonts={fonts}
                    previewText={displayName}
                    selectedFontFamily={selectedFont}
                    onConfirm={onFontChange}
                    locale={locale}
                    required
                  />
                </div>
              )}

              <CustomizationExtras
                locale={locale}
                productType={productType}
                decorationUrl={decorationUrl}
                onDecorationChange={onDecorationChange}
                capSideUrl={capSideUrl}
                capTopUrl={capTopUrl}
                onCapSideChange={onCapSideChange}
                onCapTopChange={onCapTopChange}
                showCustomReference={showCustomReference}
                customReferenceUrl={customReferenceUrl}
                onCustomReferenceChange={onCustomReferenceChange}
                className="border-warka-border"
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-warka-border/50 bg-warka-bg/50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-xs text-warka-text-muted">
              <span>
                {isAr ? `${filledZones} منطقة مخصصة` : `${filledZones} zones customized`}
              </span>
              {selectedFont && (
                <>
                  <span aria-hidden>·</span>
                  <span>{isAr ? "الخط محدد" : "Font selected"}</span>
                </>
              )}
            </div>
            <Button
              type="button"
              size="lg"
              className="min-h-11 w-full touch-manipulation"
              onClick={() => onOpenChange(false)}
            >
              {isAr ? "تم — ارجع للطلب" : "Done — back to order"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type CustomizationStudioTriggerProps = {
  locale: "ar" | "en";
  onClick: () => void;
  styleLabel?: string | null;
  fontLabel?: string | null;
  zonesFilled: number;
  zonesTotal: number;
  thumbnailUrl?: string;
  className?: string;
};

export function CustomizationStudioTrigger({
  locale,
  onClick,
  styleLabel,
  fontLabel,
  zonesFilled,
  zonesTotal,
  thumbnailUrl,
  className,
}: CustomizationStudioTriggerProps) {
  const isAr = locale === "ar";
  const complete = zonesTotal > 0 && zonesFilled >= Math.min(zonesTotal, 1);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full touch-manipulation flex-col overflow-hidden rounded-2xl border-2 text-start shadow-sm transition-all active:scale-[0.99]",
        complete
          ? "border-warka-primary/40 bg-gradient-to-b from-warka-primary/5 to-card hover:border-warka-primary/60"
          : "border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-card hover:border-amber-500/60",
        className
      )}
    >
      <div className="flex items-stretch gap-0">
        {thumbnailUrl && (
          <div
            className="relative w-24 shrink-0 bg-media-bg sm:w-28"
            style={{ backgroundImage: `url(${thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4">
          <span className="flex items-center gap-2 text-sm font-bold text-warka-text">
            <Sparkles className="size-4 shrink-0 text-warka-primary" />
            {isAr ? "تخصيص التطريز والزخرفة" : "Customize embroidery & decoration"}
          </span>
          <span className="mt-1 text-xs leading-relaxed text-warka-text-muted">
            {isAr
              ? "اضغط لفتح الاستوديو — المعاينة والخط والنقشات بمكان واحد"
              : "Tap to open studio — preview, font & patterns in one place"}
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {styleLabel && (
              <span className="rounded-full bg-warka-bg px-2 py-0.5 text-[10px] font-medium text-warka-text">
                {styleLabel}
              </span>
            )}
            {fontLabel && (
              <span className="rounded-full bg-warka-bg px-2 py-0.5 text-[10px] font-medium text-warka-text">
                {fontLabel}
              </span>
            )}
            {zonesTotal > 0 && (
              <span className="rounded-full bg-warka-primary/10 px-2 py-0.5 text-[10px] font-medium text-warka-primary">
                {isAr ? `${zonesFilled}/${zonesTotal} مناطق` : `${zonesFilled}/${zonesTotal} zones`}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
