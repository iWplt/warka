"use client";

import { MessageCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { buildWhatsAppUrl } from "@/lib/constants/iraq-market";
import { cn } from "@/lib/utils";

type WhatsAppButtonProps = {
  message?: string;
  className?: string;
};

export function WhatsAppButton({ message, className }: WhatsAppButtonProps) {
  const locale = useLocale();

  const defaultMessage =
    locale === "ar"
      ? "مرحباً، أريد الاستفسار عن منتجات WARKA للتخرج"
      : "Hello, I would like to inquire about WARKA graduation products";

  const href = buildWhatsAppUrl(message ?? defaultMessage);
  const label = locale === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "fixed end-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_16px_rgba(37,211,102,0.4)] transition-transform duration-200 hover:scale-105 active:scale-95",
        "bottom-20 md:bottom-6",
        className
      )}
    >
      <MessageCircle className="h-7 w-7" strokeWidth={2} aria-hidden />
    </a>
  );
}
