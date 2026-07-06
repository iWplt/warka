"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, Type, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fontDisplayName, findFontByFamily } from "@/lib/constants/arabic-font-presets";
import type { WarkaFont } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

const PANEL_CLASS = cn(
  "flex flex-col overflow-hidden border border-warka-border bg-card text-warka-text shadow-tint-lg outline-none",
  "inset-x-0 bottom-0 top-[6dvh] max-h-none w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none",
  "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[min(92vh,680px)] sm:w-[calc(100%-1.5rem)] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
);

type FontPickerPanelProps = {
  fonts: WarkaFont[];
  previewText: string;
  selectedFontFamily: string | null;
  onConfirm: (fontFamily: string) => void;
  onClose: () => void;
  locale: "ar" | "en";
  lockName?: boolean;
  titleId?: string;
  closeButton: ReactNode;
  title: ReactNode;
};

function FontPickerPanel({
  fonts,
  previewText,
  selectedFontFamily,
  onConfirm,
  onClose,
  locale,
  lockName = true,
  titleId,
  closeButton,
  title,
}: FontPickerPanelProps) {
  const isAr = locale === "ar";
  const [draftFont, setDraftFont] = useState(selectedFontFamily ?? fonts[0]?.font_family_css ?? "");
  const [draftText, setDraftText] = useState(previewText);
  const [previewScale, setPreviewScale] = useState(48);

  useEffect(() => {
    setDraftFont(selectedFontFamily ?? fonts[0]?.font_family_css ?? "");
    setDraftText(previewText);
  }, [previewText, selectedFontFamily, fonts]);

  const activeFont = findFontByFamily(fonts, draftFont) ?? fonts[0];
  const displayText = draftText.trim() || (isAr ? "اسمك" : "Your name");

  const grouped = useMemo(() => {
    const map = new Map<string, WarkaFont[]>();
    for (const font of fonts) {
      const key = font.category ?? "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(font);
    }
    return map;
  }, [fonts]);

  const categoryLabel = (key: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      thuluth: { ar: "ثلث", en: "Thuluth" },
      naskh: { ar: "نسخ", en: "Naskh" },
      diwani: { ar: "ديواني", en: "Diwani" },
      kufi: { ar: "كوفي", en: "Kufi" },
      ruqaa: { ar: "رقعة", en: "Ruqaa" },
      nastaliq: { ar: "فارسي", en: "Persian" },
      calligraphy: { ar: "خطوط", en: "Calligraphy" },
      display: { ar: "عرض", en: "Display" },
      other: { ar: "أخرى", en: "Other" },
    };
    const label = labels[key] ?? labels.other;
    return isAr ? label.ar : label.en;
  };

  const handleConfirm = () => {
    if (!draftFont) return;
    onConfirm(draftFont);
    onClose();
  };

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-warka-border/50 bg-warka-primary/5 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-warka-primary/15 text-warka-primary sm:flex">
            <Type className="size-4" aria-hidden />
          </span>
          <div className="min-w-0" id={titleId}>
            {title}
          </div>
        </div>
        {closeButton}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex shrink-0 flex-col border-b border-warka-border/50 bg-gradient-to-b from-warka-bg to-warka-accent/20 lg:w-[52%] lg:border-b-0 lg:border-e">
          <div className="border-b border-warka-border/40 px-4 py-2.5 sm:px-5 sm:py-3">
            <p className="text-xs font-medium text-warka-text-muted">
              {isAr ? "النص للمعاينة" : "Preview text"}
            </p>
            <p
              className="mt-1 truncate text-lg font-semibold text-warka-text"
              dir="rtl"
              title={displayText}
            >
              {displayText}
            </p>
            {!lockName && (
              <input
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                dir="rtl"
                className="mt-2 w-full rounded-lg border border-warka-border bg-card px-3 py-2 text-base text-warka-text outline-none focus:ring-2 focus:ring-warka-primary/30"
                placeholder={isAr ? "اكتب للمعاينة" : "Type to preview"}
              />
            )}
          </div>

          <div className="flex min-h-[120px] flex-col items-center justify-center px-4 py-5 sm:min-h-[160px] sm:px-6 sm:py-8">
            <div
              className="max-w-full break-words text-center leading-relaxed text-warka-text"
              style={{
                fontFamily: `"${draftFont}", serif`,
                fontSize: `clamp(1.75rem, ${Math.min(previewScale, 56) * 0.14}vw, ${previewScale}px)`,
              }}
              dir="rtl"
            >
              {displayText}
            </div>
            {activeFont && (
              <p className="mt-4 text-xs text-warka-text-muted">
                {fontDisplayName(activeFont, locale)}
              </p>
            )}
          </div>

          <div className="border-t border-warka-border/40 px-4 py-2.5 sm:px-5 sm:py-3">
            <div className="flex items-center justify-between gap-3 text-xs text-warka-text-muted">
              <span>{isAr ? "حجم المعاينة" : "Preview size"}</span>
              <span className="font-medium text-warka-text">{previewScale}px</span>
            </div>
            <input
              type="range"
              min={28}
              max={72}
              value={previewScale}
              onChange={(e) => setPreviewScale(Number(e.target.value))}
              className="mt-2 w-full accent-warka-primary"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
          <div className="shrink-0 border-b border-warka-border/40 px-4 py-2.5 sm:px-5 sm:py-3">
            <p className="text-sm font-semibold text-warka-text">
              {isAr ? "قائمة الخطوط" : "Font list"}
            </p>
            <p className="text-xs text-warka-text-muted">
              {isAr ? `${fonts.length} خط متاح` : `${fonts.length} fonts available`}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [-webkit-overflow-scrolling:touch] max-lg:max-h-[38dvh]">
            {[...grouped.entries()].map(([category, items]) => (
              <div key={category} className="mb-4 last:mb-0">
                <p className="mb-2 px-2 text-[11px] font-bold tracking-wide text-warka-primary uppercase">
                  {categoryLabel(category)}
                </p>
                <div className="space-y-1.5">
                  {items.map((font) => {
                    const selected = draftFont === font.font_family_css;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setDraftFont(font.font_family_css)}
                        className={cn(
                          "flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-all",
                          selected
                            ? "border-warka-primary bg-warka-primary/10 shadow-sm"
                            : "border-warka-border/50 bg-warka-bg/30 hover:border-warka-primary/35 hover:bg-warka-primary/5"
                        )}
                      >
                        <span
                          className="min-w-0 flex-1 truncate text-base text-warka-text"
                          style={{ fontFamily: `"${font.font_family_css}", serif` }}
                        >
                          {fontDisplayName(font, locale)}
                        </span>
                        {selected && (
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-warka-primary text-white">
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-warka-border/50 bg-warka-bg/40 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-3 sm:px-5 sm:py-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-11 flex-1 touch-manipulation border-warka-border text-warka-text hover:bg-warka-bg sm:min-h-10"
          onClick={onClose}
        >
          {isAr ? "إلغاء" : "Cancel"}
        </Button>
        <Button
          type="button"
          variant="default"
          size="lg"
          className="min-h-11 flex-1 touch-manipulation sm:min-h-10"
          onClick={handleConfirm}
        >
          {isAr ? "تأكيد الخط" : "Confirm font"}
        </Button>
      </div>
    </>
  );
}

type FontPickerPopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fonts: WarkaFont[];
  previewText: string;
  selectedFontFamily: string | null;
  onConfirm: (fontFamily: string) => void;
  locale: "ar" | "en";
  /** Lock name field — name edited outside popup */
  lockName?: boolean;
  /** Use plain portal overlay instead of Radix Dialog (required inside other modals) */
  nested?: boolean;
};

export function FontPickerPopup({
  open,
  onOpenChange,
  fonts,
  previewText,
  selectedFontFamily,
  onConfirm,
  locale,
  lockName = true,
  nested = false,
}: FontPickerPopupProps) {
  const isAr = locale === "ar";
  const titleId = "font-picker-title";

  useEffect(() => {
    if (!open || !nested) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, nested, onOpenChange]);

  if (fonts.length === 0) return null;

  const title = (
    <>
      <p className="truncate text-base font-bold text-warka-text">
        {isAr ? "معاينة واختيار الخط" : "Font preview & picker"}
      </p>
      <p className="hidden text-xs text-warka-text-muted sm:block">
        {isAr ? "اختر خطاً وشوف شلون يطلع اسمك" : "Pick a font and preview your name"}
      </p>
    </>
  );

  const closeClassName =
    "flex size-10 shrink-0 touch-manipulation items-center justify-center rounded-full border border-warka-border/60 text-warka-text-muted transition-colors hover:border-warka-primary/40 hover:bg-warka-bg hover:text-warka-text";

  const panelProps = {
    fonts,
    previewText,
    selectedFontFamily,
    onConfirm,
    onClose: () => onOpenChange(false),
    locale,
    lockName,
    titleId,
    title,
  };

  if (nested) {
    if (!open || typeof document === "undefined") return null;

    return createPortal(
      <div className="font-picker-nested-root">
        <button
          type="button"
          className="fixed inset-0 z-[100] cursor-default bg-warka-text/25 backdrop-blur-[2px]"
          onClick={() => onOpenChange(false)}
          aria-label={isAr ? "إغلاق" : "Close"}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn("fixed z-[101] flex", PANEL_CLASS)}
        >
          <FontPickerPanel
            {...panelProps}
            closeButton={
              <button
                type="button"
                className={closeClassName}
                onClick={() => onOpenChange(false)}
                aria-label={isAr ? "إغلاق" : "Close"}
              >
                <X className="size-4" />
              </button>
            }
          />
        </div>
      </div>,
      document.body
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-warka-text/25 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed z-[91] flex",
            PANEL_CLASS,
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-bottom-[8%] data-[state=open]:slide-in-from-bottom-[8%]",
            "sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0",
            "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95"
          )}
        >
          <FontPickerPanel
            {...panelProps}
            closeButton={
              <Dialog.Close className={closeClassName} aria-label={isAr ? "إغلاق" : "Close"}>
                <X className="size-4" />
              </Dialog.Close>
            }
            title={
              <>
                <Dialog.Title className="truncate text-base font-bold text-warka-text">
                  {isAr ? "معاينة واختيار الخط" : "Font preview & picker"}
                </Dialog.Title>
                <p className="hidden text-xs text-warka-text-muted sm:block">
                  {isAr ? "اختر خطاً وشوف شلون يطلع اسمك" : "Pick a font and preview your name"}
                </p>
              </>
            }
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type FontPickerTriggerProps = {
  fonts: WarkaFont[];
  previewText: string;
  selectedFontFamily: string | null;
  onConfirm: (fontFamily: string) => void;
  locale: "ar" | "en";
  className?: string;
  required?: boolean;
  /** Render above parent modals without Radix dialog nesting */
  nested?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function FontPickerTrigger({
  fonts,
  previewText,
  selectedFontFamily,
  onConfirm,
  locale,
  className,
  required = false,
  nested = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: FontPickerTriggerProps) {
  const isAr = locale === "ar";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const selected = findFontByFamily(fonts, selectedFontFamily);

  if (fonts.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex min-h-[52px] w-full touch-manipulation items-center gap-3 rounded-xl border border-warka-border bg-gradient-to-b from-card to-warka-bg/50 px-4 py-3.5 text-start shadow-sm transition-all hover:border-warka-primary/50 hover:shadow-md active:scale-[0.99]",
          required && !selectedFontFamily && "border-amber-500/50 bg-amber-500/5",
          className
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warka-primary/12 text-warka-primary transition-colors group-hover:bg-warka-primary/20">
          <Type className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-warka-text">
            {isAr ? "معاينة واختيار الخط" : "Preview & pick font"}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-sm",
              selected ? "text-warka-primary" : "text-warka-text-muted"
            )}
            style={
              selected
                ? { fontFamily: `"${selectedFontFamily}", serif` }
                : undefined
            }
          >
            {selected
              ? fontDisplayName(selected, locale)
              : isAr
                ? "اضغط لفتح قائمة الخطوط"
                : "Tap to open font list"}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-warka-text-muted transition-transform group-hover:text-warka-primary" />
      </button>

      <FontPickerPopup
        open={open}
        onOpenChange={setOpen}
        fonts={fonts}
        previewText={previewText}
        selectedFontFamily={selectedFontFamily}
        onConfirm={onConfirm}
        locale={locale}
        lockName
        nested={nested}
      />
    </>
  );
}
