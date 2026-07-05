"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type OptionPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  locale: "ar" | "en";
  onConfirm?: () => void;
  confirmLabel?: string;
};

export function OptionPreviewModal({
  open,
  onOpenChange,
  title,
  subtitle,
  imageUrl,
  locale,
  onConfirm,
  confirmLabel,
}: OptionPreviewModalProps) {
  const isAr = locale === "ar";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed z-[86] flex flex-col overflow-hidden border border-warka-border bg-card shadow-tint-lg outline-none",
            "inset-x-0 bottom-0 top-[12dvh] max-h-none w-full max-w-none rounded-t-2xl rounded-b-none",
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[min(92vh,640px)] sm:w-[calc(100%-1.5rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-bottom-[8%] data-[state=open]:slide-in-from-bottom-[8%]",
            "sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0",
            "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95"
          )}
        >
          <Dialog.Close
            className="absolute end-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-card/95 text-warka-text shadow-card hover:bg-warka-bg"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="size-4" />
          </Dialog.Close>

          <div className="relative aspect-[4/5] overflow-hidden rounded-t-2xl bg-media-bg">
            {imageUrl ? (
              <Image src={imageUrl} alt={title} fill className="object-contain p-2" sizes="400px" unoptimized={imageUrl.startsWith("data:")} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-warka-text-muted">
                <span className="text-4xl opacity-40">✦</span>
                <p>{isAr ? "لا توجد صورة معاينة — ارفعها من لوحة الإدارة" : "No preview image — upload one in admin"}</p>
              </div>
            )}
          </div>

          <div className="space-y-3 p-5">
            <Dialog.Title className="text-lg font-bold text-warka-text">{title}</Dialog.Title>
            {subtitle && (
              <Dialog.Description className="text-sm leading-relaxed text-warka-text-secondary">
                {subtitle}
              </Dialog.Description>
            )}
            {onConfirm && (
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
                className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-warka-primary py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark"
              >
                <Check className="size-4" />
                {confirmLabel ?? (isAr ? "اختر هذا" : "Select this")}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
