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
      <div className="rounded-2xl glass p-6">
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
        const { studentName, sections } = buildOrderItemDetailRows(item, order.type, media);

        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-glass-border glass"
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-glass-border bg-foreground/[0.03] px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isAr ? `منتج ${index + 1}` : `Item ${index + 1}`}
                </p>
                <h3 className="mt-0.5 text-lg font-bold">{productT(item.product_type)}</h3>
                {studentName && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <User className="size-3.5 shrink-0" />
                    {studentName}
                  </p>
                )}
              </div>
              <p className="text-lg font-bold tabular-nums text-accent">
                {formatIqd(Number(item.unit_price), locale)}
              </p>
            </header>

            <div className="space-y-4 p-4 sm:p-5">
              {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isAr ? "لا توجد تفاصيل إضافية لهذا المنتج" : "No extra details for this product"}
                </p>
              ) : (
                sections.map((section) => (
                  <section key={section.id}>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {isAr ? section.titleAr : section.titleEn}
                    </h4>
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {section.rows.map((detail) => (
                        <div
                          key={detail.key}
                          className={cn(
                            "rounded-xl border border-glass-border bg-foreground/[0.03] px-3 py-2.5",
                            detail.kind === "image" && "sm:col-span-2"
                          )}
                        >
                          <dt className="text-[11px] font-medium text-muted-foreground">
                            {isAr ? detail.labelAr : detail.labelEn}
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-foreground">
                            {detail.kind === "font" ? (
                              <span style={{ fontFamily: detail.value }} dir="rtl">
                                {detail.value}
                                <span className="ms-2 font-normal text-muted-foreground" dir="ltr">
                                  ({detail.value})
                                </span>
                              </span>
                            ) : detail.kind === "image" && detail.imageUrl ? (
                              <div className="mt-2 space-y-2">
                                <a
                                  href={detail.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative block aspect-video max-w-sm overflow-hidden rounded-lg border border-glass-border bg-foreground/5"
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
                                  {isAr ? "فتح الصورة" : "Open image"}
                                  <ExternalLink className="size-3" />
                                </a>
                              </div>
                            ) : (
                              <span dir={detail.key === "custom_text" ? "rtl" : undefined}>
                                {detail.value}
                              </span>
                            )}
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
