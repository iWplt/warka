"use client";

import { useMemo, useState } from "react";
import { Ruler } from "lucide-react";
import { WarkaCard } from "@/components/ui/warka-card";
import { Label } from "@/components/ui/label";
import { suggestSizeFromGuide } from "@/lib/settings/size-guide";
import {
  findEntryByDisplayCode,
  sizeButtonLabel,
  suggestCapSizeFromHeadCm,
} from "@/lib/settings/size-display";
import type { SizeGuideEntry } from "@/lib/settings/types";
import type { ProductType } from "@/types/database";
import { cn } from "@/lib/utils";

type MeasurementMode = "body" | "head" | "custom";

type InlineSizeGuideProps = {
  entries: SizeGuideEntry[];
  productType: ProductType;
  locale: "ar" | "en";
  selectedSize: string;
  onSizeChange: (size: string) => void;
  sizeOptions: string[];
  customMeasurements?: string;
  onCustomMeasurementsChange?: (value: string) => void;
  className?: string;
};

export function InlineSizeGuide({
  entries,
  productType,
  locale,
  selectedSize,
  onSizeChange,
  sizeOptions,
  customMeasurements = "",
  onCustomMeasurementsChange,
  className,
}: InlineSizeGuideProps) {
  const isAr = locale === "ar";
  const isCap = productType === "cap";
  const [mode, setMode] = useState<MeasurementMode>("body");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [headCm, setHeadCm] = useState(56);

  const bodySuggested = useMemo(() => {
    if (entries.length === 0) return null;
    return suggestSizeFromGuide(entries, height, weight, productType);
  }, [entries, height, weight, productType]);

  const bodySuggestedCode = bodySuggested ? sizeButtonLabel(bodySuggested) : null;
  const headSuggestedCode = isCap ? suggestCapSizeFromHeadCm(headCm) : null;
  const activeSuggestedCode = mode === "head" ? headSuggestedCode : bodySuggestedCode;

  const modeTabs: { key: MeasurementMode; label: string }[] = [
    { key: "body", label: isAr ? "طول / وزن" : "Height / weight" },
    ...(isCap ? [{ key: "head" as const, label: isAr ? "محيط الرأس" : "Head size" }] : []),
    { key: "custom", label: isAr ? "قياسات مخصصة" : "Custom" },
  ];

  return (
    <WarkaCard className={cn("space-y-5", className)}>
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-warka-primary/10 text-warka-primary">
          <Ruler className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-warka-text">
            {isAr ? "اختر المقاس المناسب" : "Choose your size"}
          </h2>
          <p className="text-xs text-warka-text-muted">
            {isAr
              ? "S / M / L / XL / XXL — أو أدخل قياساتك يدوياً"
              : "S / M / L / XL / XXL — or enter measurements manually"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {modeTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              mode === tab.key
                ? "border-warka-primary bg-warka-primary text-white"
                : "border-warka-border text-warka-text-secondary hover:border-warka-primary/40"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "body" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>{isAr ? "الطول" : "Height"}</span>
              <span className="font-bold text-warka-primary">
                {height} {isAr ? "سم" : "cm"}
              </span>
            </div>
            <input
              type="range"
              min={140}
              max={210}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="h-2 w-full accent-warka-primary"
            />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>{isAr ? "الوزن" : "Weight"}</span>
              <span className="font-bold text-warka-primary">
                {weight} {isAr ? "كغ" : "kg"}
              </span>
            </div>
            <input
              type="range"
              min={40}
              max={140}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="h-2 w-full accent-warka-primary"
            />
          </div>
        </div>
      )}

      {mode === "head" && isCap && (
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>{isAr ? "محيط الرأس" : "Head circumference"}</span>
            <span className="font-bold text-warka-primary">
              {headCm} {isAr ? "سم" : "cm"}
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={66}
            value={headCm}
            onChange={(e) => setHeadCm(Number(e.target.value))}
            className="h-2 w-full accent-warka-primary"
          />
          <p className="mt-2 text-xs text-warka-text-muted">
            {isAr
              ? "قِس محيط الرأس فوق الحاجبين — مفيد للقبعات"
              : "Measure around the head above the eyebrows — best for caps"}
          </p>
        </div>
      )}

      {mode === "custom" && onCustomMeasurementsChange && (
        <div>
          <Label className="mb-1 block">
            {isAr ? "قياساتك بالتفصيل" : "Your measurements in detail"}
          </Label>
          <textarea
            value={customMeasurements}
            onChange={(e) => onCustomMeasurementsChange(e.target.value)}
            rows={3}
            placeholder={
              isAr
                ? "مثال: طول 178 سم، محيط صدر 98 سم، محيط رأس 57 سم…"
                : "e.g. height 178 cm, chest 98 cm, head 57 cm…"
            }
            className="w-full rounded-xl border border-warka-border bg-card px-3 py-2 text-sm"
            dir="auto"
          />
        </div>
      )}

      {mode !== "custom" && activeSuggestedCode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warka-primary/20 bg-warka-primary/5 px-4 py-3">
          <div>
            <p className="text-xs text-warka-text-muted">
              {isAr ? "المقاس المقترح" : "Suggested size"}
            </p>
            <p className="text-2xl font-bold text-warka-primary">{activeSuggestedCode}</p>
          </div>
          <button
            type="button"
            onClick={() => onSizeChange(activeSuggestedCode)}
            className="rounded-lg bg-warka-primary px-4 py-2 text-xs font-semibold text-white hover:bg-warka-primary-dark"
          >
            {isAr ? "استخدام المقاس" : "Use this size"}
          </button>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-warka-text">
          {isAr ? "المقاس" : "Size"}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {sizeOptions.map((size) => {
            const entry = findEntryByDisplayCode(entries, size, productType);
            const title = entry
              ? isAr
                ? entry.label_ar
                : entry.label_en
              : undefined;
            return (
              <button
                key={size}
                type="button"
                title={title}
                onClick={() => onSizeChange(size)}
                className={cn(
                  "rounded-xl border-2 py-2.5 text-sm font-bold transition-colors",
                  selectedSize === size
                    ? "border-warka-primary bg-warka-primary text-white"
                    : "border-warka-border text-warka-text hover:border-warka-primary/50"
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {onCustomMeasurementsChange && mode !== "custom" && (
        <div>
          <Label className="mb-1 block text-xs text-warka-text-muted">
            {isAr ? "أو اكتب قياسات إضافية (اختياري)" : "Or add extra measurements (optional)"}
          </Label>
          <textarea
            value={customMeasurements}
            onChange={(e) => onCustomMeasurementsChange(e.target.value)}
            rows={2}
            placeholder={
              isAr
                ? "قياسات إضافية: كتف، صدر، كم…"
                : "Extra: shoulder, chest, sleeve…"
            }
            className="w-full rounded-xl border border-warka-border bg-card px-3 py-2 text-sm"
            dir="auto"
          />
        </div>
      )}
    </WarkaCard>
  );
}
