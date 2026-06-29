"use client";

import { QRCodeSVG } from "qrcode.react";

type QrCodeDisplayProps = {
  value: string;
  label?: string;
  size?: number;
};

export function QrCodeDisplay({ value, label, size = 128 }: QrCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-glass-border bg-white p-4">
      <QRCodeSVG value={value} size={size} level="M" includeMargin />
      {label && (
        <p className="text-center text-xs font-medium text-foreground">{label}</p>
      )}
    </div>
  );
}
