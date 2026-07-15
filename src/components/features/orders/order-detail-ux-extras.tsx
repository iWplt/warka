"use client";

import { MessageCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { ConfettiEffect } from "@/components/ux/confetti-effect";
import { buildWhatsAppUrl } from "@/lib/constants/iraq-market";

type OrderDetailUxExtrasProps = {
  orderNumber: string;
  status: string;
};

export function OrderDetailUxExtras({ orderNumber, status }: OrderDetailUxExtrasProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const isDelivered = status === "delivered";

  const message = isAr
    ? `مرحباً WARKA، أريد التواصل بخصوص الطلب رقم ${orderNumber}`
    : `Hi WARKA, I'd like to follow up on order ${orderNumber}`;
  const waUrl = buildWhatsAppUrl(message);

  return (
    <>
      <ConfettiEffect active={isDelivered} />
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 inline-flex items-center gap-2 rounded-[10px] border-2 border-warka-primary px-5 py-2.5 text-sm font-semibold text-warka-primary transition-all hover:bg-warka-primary hover:text-white"
        >
          <MessageCircle className="size-4" />
          {isAr ? "تواصل بخصوص الطلب" : "Contact about this order"}
        </a>
      )}
    </>
  );
}
