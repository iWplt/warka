"use client";

import { Sparkles } from "lucide-react";
import { WarkaCard } from "@/components/ui/warka-card";
import type { EmbroideryPosition } from "@/types/database";
import { cn } from "@/lib/utils";

type EmbroideryPositionsPickerProps = {
  positions: EmbroideryPosition[];
  selectedKey: string;
  onChange: (key: string) => void;
  locale: "ar" | "en";
  className?: string;
};

export function EmbroideryPositionsPicker({
  positions,
  selectedKey,
  onChange,
  locale,
  className,
}: EmbroideryPositionsPickerProps) {
  const isAr = locale === "ar";

  if (positions.length === 0) return null;

  return (
    <WarkaCard className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-warka-primary" />
        <h2 className="text-sm font-semibold text-warka-text">
          {isAr ? "أماكن التطريز" : "Embroidery placement"}
        </h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {positions.map((pos) => {
          const label = isAr ? pos.label_ar : pos.label_en;
          const selected = selectedKey === pos.key;
          return (
            <button
              key={pos.key}
              type="button"
              onClick={() => onChange(pos.key)}
              className={cn(
                "rounded-xl border-2 px-4 py-3 text-start text-sm font-medium transition-colors",
                selected
                  ? "border-warka-primary bg-warka-primary/10 text-warka-text"
                  : "border-warka-border text-warka-text-secondary hover:border-warka-primary/40"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </WarkaCard>
  );
}
