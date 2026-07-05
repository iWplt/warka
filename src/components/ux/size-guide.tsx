"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Ruler, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { suggestSizeFromGuide } from "@/lib/settings/size-guide";
import { sizeButtonLabel } from "@/lib/settings/size-display";
import type { SizeGuideEntry } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

type SizeGuideProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "ar" | "en";
  entries?: SizeGuideEntry[];
  productType?: string | null;
  onSelectSize?: (sizeLabel: string, sizeCode: string) => void;
};

export function SizeGuide({
  open,
  onOpenChange,
  locale,
  entries = [],
  productType,
  onSelectSize,
}: SizeGuideProps) {
  const isAr = locale === "ar";
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [manualSize, setManualSize] = useState<string | null>(null);

  const suggested = useMemo(() => {
    if (entries.length === 0) return null;
    return suggestSizeFromGuide(
      entries,
      height,
      weight,
      productType as SizeGuideEntry["product_type"]
    );
  }, [entries, height, weight, productType]);

  const suggestedLabel = suggested ? sizeButtonLabel(suggested) : isAr ? "—" : "—";

  const activeSelection = manualSize ?? suggestedLabel;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-warka-border bg-card p-6 shadow-tint-lg outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-warka-primary/10 text-warka-primary">
                <Ruler className="size-4" />
              </span>
              <Dialog.Title className="text-lg font-bold text-warka-text">
                {isAr ? "دليل المقاسات" : "Size guide"}
              </Dialog.Title>
            </div>
            <Dialog.Close
              className="flex size-9 items-center justify-center rounded-full text-warka-text-muted hover:bg-warka-bg"
              aria-label={isAr ? "إغلاق" : "Close"}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <Dialog.Description className="mb-6 text-sm text-warka-text-secondary">
            {isAr
              ? "أدخل طولك ووزنك للحصول على مقاس مقترح — يمكنك تعديله يدوياً."
              : "Enter your height and weight for a suggested size — you can override it manually."}
          </Dialog.Description>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-warka-text">{isAr ? "الطول" : "Height"}</span>
                <span className="font-bold text-warka-primary">
                  {height} {isAr ? "سم" : "cm"}
                </span>
              </div>
              <input
                type="range"
                min={140}
                max={210}
                step={1}
                value={height}
                onChange={(e) => {
                  setHeight(Number(e.target.value));
                  setManualSize(null);
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-warka-border accent-warka-primary"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-warka-text">{isAr ? "الوزن" : "Weight"}</span>
                <span className="font-bold text-warka-primary">
                  {weight} {isAr ? "كغ" : "kg"}
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={140}
                step={1}
                value={weight}
                onChange={(e) => {
                  setWeight(Number(e.target.value));
                  setManualSize(null);
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-warka-border accent-warka-primary"
              />
            </div>

            <div className="rounded-xl border border-warka-primary/20 bg-warka-primary/5 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-warka-text-muted">
                {isAr ? "المقاس المقترح" : "Suggested size"}
              </p>
              <p className="mt-1 text-2xl font-bold text-warka-primary">{suggestedLabel}</p>
            </div>

            {entries.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-warka-text">
                  {isAr ? "أو اختر مقاساً يدوياً" : "Or pick a size manually"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {entries
                    .filter(
                      (e) =>
                        e.is_active &&
                        (!productType || e.product_type === productType || !e.product_type)
                    )
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((entry) => {
                      const label = sizeButtonLabel(entry);
                      const title = isAr ? entry.label_ar : entry.label_en;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          title={title}
                          onClick={() => setManualSize(label)}
                          className={cn(
                            "rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-colors",
                            activeSelection === label
                              ? "border-warka-primary bg-warka-primary text-white"
                              : "border-warka-border text-warka-text hover:border-warka-primary/50"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            className="mt-6 w-full"
            onClick={() => {
              if (suggested && onSelectSize) {
                const chosen = manualSize ?? sizeButtonLabel(suggested);
                const entry =
                  entries.find(
                    (e) =>
                      sizeButtonLabel(e) === chosen ||
                      e.label_ar === chosen ||
                      e.label_en === chosen ||
                      e.size_code.toUpperCase() === chosen.toUpperCase()
                  ) ?? suggested;
                onSelectSize(chosen, entry.size_code);
              }
              onOpenChange(false);
            }}
          >
            {isAr ? "تم" : "Done"}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
