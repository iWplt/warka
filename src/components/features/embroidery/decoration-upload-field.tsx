"use client";

import { useRef } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateProductImageFile } from "@/lib/upload/validate";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DecorationUploadFieldProps = {
  imageUrl: string | null;
  onChange: (dataUrl: string | null) => void;
  locale: "ar" | "en";
  className?: string;
  compact?: boolean;
};

export function DecorationUploadField({
  imageUrl,
  onChange,
  locale,
  className,
  compact = false,
}: DecorationUploadFieldProps) {
  const isAr = locale === "ar";
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const validation = validateProductImageFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
        toast.success(isAr ? "تم رفع صورة الزخرفة" : "Decoration uploaded");
      }
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-semibold text-warka-text">
          {isAr ? "مرجع الزخرفة (اختياري)" : "Decoration reference (optional)"}
        </p>
        <p className="mt-1 text-xs text-warka-text-muted">
          {isAr
            ? "إذا عندك شكل أو نوع زخرفة جاهز — ارفعه للورشة. الشكل النهائي يوصلك بعد الطباعة."
            : "If you have a ready decoration design, upload it for the workshop. Final design arrives after printing."}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full touch-manipulation gap-2 border-warka-primary/40 text-warka-primary hover:bg-warka-primary/10 sm:w-auto"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden />
          {isAr ? "رفع شكل الزخرفة" : "Upload decoration file"}
        </Button>
        {imageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-destructive"
            onClick={() => onChange(null)}
          >
            <Trash2 className="size-3.5" aria-hidden />
            {isAr ? "إزالة" : "Remove"}
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {!compact && (
        <p className="text-xs text-warka-text-muted">
          {isAr ? "PNG أو JPG — حتى 15MB" : "PNG or JPG — up to 15MB"}
        </p>
      )}

      {imageUrl && (
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-warka-border bg-warka-bg",
            compact ? "mx-auto aspect-video w-full max-w-[200px]" : "aspect-[4/3] max-w-sm"
          )}
        >
          <Image
            src={imageUrl}
            alt={isAr ? "معاينة الزخرفة" : "Decoration preview"}
            fill
            className="object-contain p-2"
            unoptimized
          />
        </div>
      )}

      {!imageUrl && !compact && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-warka-border/70 bg-warka-bg/40 px-4 py-3 text-xs text-warka-text-muted">
          <ImagePlus className="size-4 shrink-0 text-warka-primary/70" aria-hidden />
          {isAr ? "لم يُرفع مرجع بعد" : "No reference uploaded yet"}
        </div>
      )}
    </div>
  );
}
