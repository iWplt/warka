"use client";

import { ExternalLink, MapPin, Package, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatIqd } from "@/lib/format/currency";
import {
  buildOrderItemDetailRows,
  type OrderItemMedia,
} from "@/lib/orders/order-item-details";
import type { Order, OrderItem } from "@/types/database";
import { cn } from "@/lib/utils";

type OrderItemsDetailPanelProps = {
  order: Order;
  items: OrderItem[];
  itemMedia?: Record<string, OrderItemMedia>;
};

function DetailValue({
  detail,
  isAr,
}: {
  detail: {
    key: string;
    labelAr: string;
    labelEn: string;
    value: string;
    kind?: "text" | "font" | "image" | "color";
    imageUrl?: string | null;
    colorHex?: string | null;
  };
  isAr: boolean;
}) {
  if (detail.kind === "font") {
    return (
      <span style={{ fontFamily: detail.value }} dir="rtl">
        {detail.value}
        <span className="ms-2 font-normal text-muted-foreground" dir="ltr">
          ({detail.value})
        </span>
      </span>
    );
  }

  if (detail.kind === "color") {
    const hex = detail.colorHex?.startsWith("#") ? detail.colorHex : null;
    return (
      <span className="inline-flex items-center gap-2">
        {hex && (
          <span
            className="inline-block size-5 shrink-0 rounded-md border border-warka-border"
            style={{ backgroundColor: hex }}
            title={hex}
            aria-hidden
          />
        )}
        <span dir="auto">{detail.value}</span>
      </span>
    );
  }

  if (detail.kind === "image" && detail.imageUrl) {
    return (
      <div className="mt-2 space-y-2">
        <a
          href={detail.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-video max-w-md overflow-hidden rounded-lg border border-warka-border bg-warka-bg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={detail.imageUrl}
            alt={isAr ? detail.labelAr : detail.labelEn}
            className="h-full w-full object-contain"
          />
        </a>
        <a
          href={detail.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {isAr ? "فتح الصورة بالحجم الكامل" : "Open full-size image"}
          <ExternalLink className="size-3" />
        </a>
      </div>
    );
  }

  return (
    <span dir={detail.key.includes("text") || detail.key === "custom_text" ? "rtl" : undefined}>
      {detail.value}
    </span>
  );
}

export function OrderItemsDetailPanel({
  order,
  items,
  itemMedia = {},
}: OrderItemsDetailPanelProps) {
  const locale = useLocale() as "ar" | "en";
  const isAr = locale === "ar";
  const productT = useTranslations("productType");
  const t = useTranslations("orders");

  if (items.length === 0) {
    return (
      <div className="utility-surface p-6">
        <p className="text-sm text-muted-foreground">
          {isAr ? "لا توجد منتجات في هذا الطلب" : "No products in this order"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="size-5 text-primary" aria-hidden />
        <h2 className="font-semibold">{t("itemsTitle")}</h2>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {items.length}
        </span>
      </div>

      {items.map((item, index) => {
        const media = itemMedia[item.id];
        const { studentName, productTitle, sections } = buildOrderItemDetailRows(
          item,
          order.type,
          media
        );
        const typeLabel = productT(item.product_type);
        const heading = productTitle ? `${productTitle} · ${typeLabel}` : typeLabel;

        return (
          <article
            key={item.id}
            className="overflow-hidden utility-surface"
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-warka-border bg-warka-bg/40 px-4 py-4 sm:px-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {media?.productImageUrl && (
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-warka-border bg-warka-bg sm:size-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={media.productImageUrl}
                      alt={heading}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {isAr ? `منتج ${index + 1}` : `Item ${index + 1}`}
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold leading-snug">{heading}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {item.sash_color && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5">
                        {item.sash_color.startsWith("#") && (
                          <span
                            className="size-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: item.sash_color }}
                          />
                        )}
                        {isAr ? "اللون" : "Color"}: {item.sash_color}
                      </span>
                    )}
                    {item.font_family && (
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5">
                        {isAr ? "الخط" : "Font"}:{" "}
                        <span style={{ fontFamily: item.font_family }}>{item.font_family}</span>
                      </span>
                    )}
                    {item.custom_text && (
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5" dir="rtl">
                        &ldquo;{item.custom_text}&rdquo;
                      </span>
                    )}
                  </div>
                  {studentName && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <User className="size-3.5 shrink-0" />
                      {studentName}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-lg font-bold tabular-nums text-accent">
                {formatIqd(Number(item.unit_price), locale)}
              </p>
            </header>

            <div className="space-y-5 p-4 sm:p-5">
              {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isAr ? "لا توجد تفاصيل إضافية لهذا المنتج" : "No extra details for this product"}
                </p>
              ) : (
                sections.map((section) => (
                  <section key={section.id}>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {section.id === "attachments" && (
                        <MapPin className="size-3.5 text-primary" aria-hidden />
                      )}
                      {isAr ? section.titleAr : section.titleEn}
                    </h4>
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {section.rows.map((detail) => (
                        <div
                          key={detail.key}
                          className={cn(
                            "rounded-xl border border-warka-border bg-warka-bg/30 px-3 py-2.5",
                            detail.kind === "image" && "sm:col-span-2"
                          )}
                        >
                          <dt className="text-[11px] font-medium text-muted-foreground">
                            {isAr ? detail.labelAr : detail.labelEn}
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-foreground">
                            <DetailValue detail={detail} isAr={isAr} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
