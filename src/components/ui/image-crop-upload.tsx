"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crop, ZoomIn, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCroppedImageDataUrl,
  loadImageFromFile,
  type CropArea,
} from "@/lib/upload/crop-image";
import { validateProductImageFile } from "@/lib/upload/validate";
import { cn } from "@/lib/utils";

type ImageCropUploadProps = {
  value?: string | null;
  onChange: (dataUrl: string) => void;
  guidelines?: string;
  label?: string;
  className?: string;
};

export function ImageCropUpload({
  value,
  onChange,
  guidelines,
  label,
  className,
}: ImageCropUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const resetEditor = useCallback(() => {
    setImage(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setOpen(false);
    setError(null);
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    const validation = validateProductImageFile(file);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    try {
      const img = await loadImageFromFile(file);
      setImage(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setOpen(true);
    } catch {
      setError("Could not load image");
    }
  };

  const applyCrop = () => {
    if (!image || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = image.naturalWidth / (rect.width * zoom);
    const scaleY = image.naturalHeight / (rect.height * zoom);
    const displayCropW = rect.width * 0.85;
    const displayCropH = rect.height * 0.85;
    const cx = (rect.width - displayCropW) / 2 - offset.x;
    const cy = (rect.height - displayCropH) / 2 - offset.y;

    const actualCrop: CropArea = {
      x: Math.max(0, cx * scaleX),
      y: Math.max(0, cy * scaleY),
      width: Math.min(image.naturalWidth, displayCropW * scaleX),
      height: Math.min(image.naturalHeight, displayCropH * scaleY),
    };

    const dataUrl = getCroppedImageDataUrl(image, actualCrop, {
      maxWidth: 2000,
      maxHeight: 2000,
    });
    onChange(dataUrl);
    resetEditor();
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const point = "touches" in e ? e.touches[0] : e;
      setOffset({
        x: dragStart.current.ox + (point.clientX - dragStart.current.x),
        y: dragStart.current.oy + (point.clientY - dragStart.current.y),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging]);

  return (
    <div className={cn("space-y-3", className)}>
      {label && <p className="text-sm font-medium text-warka-text">{label}</p>}
      {guidelines && (
        <p className="rounded-xl border-2 border-warka-border bg-white px-3 py-2.5 text-sm leading-relaxed text-warka-text-secondary">
          {guidelines}
        </p>
      )}

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-warka-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="aspect-square w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute end-2 top-2 rounded-lg bg-black/50 p-1.5 text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-warka-border bg-warka-bg py-10 text-warka-text-secondary transition-colors hover:border-warka-primary/40"
        >
          <Upload className="size-8 text-warka-primary" />
          <span className="text-sm font-medium">رفع صورة / Upload image</span>
          <span className="text-xs">PNG · JPEG · WebP · GIF — حتى 15MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl border-warka-border"
          onClick={() => inputRef.current?.click()}
        >
          <Crop className="me-2 size-4" />
          تغيير الصورة
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {open && image && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-warka-text">قص وتعديل الصورة</h3>
            <div
              ref={containerRef}
              className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl bg-[#1a1a1a]"
              onMouseDown={(e) => {
                setDragging(true);
                dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
              }}
              onTouchStart={(e) => {
                const t = e.touches[0];
                setDragging(true);
                dragStart.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt=""
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                }}
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="size-[85%] rounded-lg border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <ZoomIn className="size-4 shrink-0 text-warka-text-muted" />
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={resetEditor}>
                إلغاء
              </Button>
              <Button type="button" onClick={applyCrop} className="bg-warka-primary hover:bg-warka-primary-dark">
                تطبيق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
