"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye } from "lucide-react";
import { OptionPreviewModal } from "@/components/features/customization/option-preview-modal";
import { cn } from "@/lib/utils";

export type VisualOption = {
  id: string;
  label: string;
  previewUrl?: string | null;
  subtitle?: string;
};

type VisualOptionPickerProps = {
  label?: string;
  options: VisualOption[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  locale: "ar" | "en";
  columns?: 2 | 3 | 4;
};

export function VisualOptionPicker({
  label,
  options,
  selectedId,
  onSelect,
  locale,
  columns = 3,
}: VisualOptionPickerProps) {
  const isAr = locale === "ar";
  const [preview, setPreview] = useState<VisualOption | null>(null);

  if (options.length === 0) return null;

  return (
    <>
      {label && <p className="mb-2 text-sm font-semibold text-warka-text">{label}</p>}
      <div
        className={cn(
          "grid gap-2",
          columns === 2 && "grid-cols-2",
          columns === 3 && "grid-cols-2 sm:grid-cols-3",
          columns === 4 && "grid-cols-2 sm:grid-cols-4"
        )}
      >
        {options.map((opt) => {
          const selected = selectedId === opt.id;
          return (
            <div key={opt.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(opt.id)}
                className={cn(
                  "flex w-full flex-col overflow-hidden rounded-xl border-2 text-start transition-all",
                  selected
                    ? "border-warka-primary bg-warka-primary/5 ring-2 ring-warka-primary/20"
                    : "border-warka-border hover:border-warka-primary/50"
                )}
              >
                <div className="relative aspect-square bg-media-bg">
                  {opt.previewUrl ? (
                    <Image
                      src={opt.previewUrl}
                      alt={opt.label}
                      fill
                      className="object-cover"
                      sizes="120px"
                      unoptimized={opt.previewUrl.startsWith("data:")}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-warka-bg to-warka-accent/30 text-2xl text-warka-primary/40">
                      ✦
                    </div>
                  )}
                </div>
                <span className="px-2 py-2 text-[11px] font-medium leading-snug text-warka-text line-clamp-2">
                  {opt.label}
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(opt);
                }}
                className="absolute end-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-card/90 text-warka-primary shadow-sm opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                aria-label={isAr ? "معاينة" : "Preview"}
              >
                <Eye className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <OptionPreviewModal
        open={Boolean(preview)}
        onOpenChange={(o) => !o && setPreview(null)}
        title={preview?.label ?? ""}
        subtitle={preview?.subtitle}
        imageUrl={preview?.previewUrl}
        locale={locale}
        onConfirm={preview ? () => onSelect(preview.id) : undefined}
      />
    </>
  );
}
