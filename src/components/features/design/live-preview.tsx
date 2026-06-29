"use client";

import { useEffect, useRef, useState } from "react";
import type { TemplateConfig } from "@/types/database";

type LivePreviewProps = {
  templateImageUrl?: string;
  config: TemplateConfig;
  values: Record<string, string>;
  logoUrl?: string;
  fontFamily?: string;
  className?: string;
};

export function LivePreview({
  templateImageUrl,
  config,
  values,
  logoUrl,
  fontFamily,
  className,
}: LivePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(Boolean(templateImageUrl));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = config.width * dpr;
    canvas.height = config.height * dpr;
    canvas.style.width = `${config.width}px`;
    canvas.style.height = `${config.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let cancelled = false;

    const drawTextAndLogo = () => {
      if (logoUrl && config.logoSlot) {
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.onload = () => {
          if (cancelled) return;
          ctx.drawImage(
            logo,
            config.logoSlot!.x,
            config.logoSlot!.y,
            config.logoSlot!.width,
            config.logoSlot!.height
          );
        };
        logo.src = logoUrl;
      }

      config.textSlots.forEach((slot) => {
        const text = values[slot.field] ?? "";
        if (!text) return;

        const family = fontFamily ?? slot.fontFamily;
        ctx.font = `${slot.fontSize}px ${family}`;
        ctx.fillStyle = slot.color;
        ctx.textAlign = slot.align;
        ctx.fillText(text, slot.x, slot.y, slot.maxWidth);
      });
    };

    const draw = () => {
      ctx.fillStyle = config.backgroundColor ?? "#1a1a2e";
      ctx.fillRect(0, 0, config.width, config.height);

      if (templateImageUrl) {
        setLoading(true);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (cancelled) return;
          ctx.drawImage(img, 0, 0, config.width, config.height);
          drawTextAndLogo();
          setLoading(false);
        };
        img.onerror = () => {
          if (cancelled) return;
          drawTextAndLogo();
          setLoading(false);
        };
        img.src = templateImageUrl;
      } else {
        drawTextAndLogo();
        setLoading(false);
      }
    };

    draw();

    return () => {
      cancelled = true;
    };
  }, [templateImageUrl, config, values, logoUrl, fontFamily]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60">
          <span className="text-sm text-muted-foreground">...</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={className ?? "w-full max-w-md rounded-2xl border border-glass-border shadow-lg"}
      />
    </div>
  );
}

export function getPreviewDataUrl(canvas: HTMLCanvasElement | null): string | null {
  if (!canvas) return null;
  return canvas.toDataURL("image/png");
}
