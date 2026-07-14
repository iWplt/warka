"use client";

import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft, Sparkles, Palette } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import { useDeliveryStore } from "@/stores/delivery-store";
import { formatIqd } from "@/lib/format/currency";
import { EmptyState } from "@/components/ui/empty-state";
import { DeliveryDetailsForm } from "@/components/features/delivery/delivery-details-form";
import { isDeliveryComplete } from "@/lib/delivery/format-delivery-note";
import { cn } from "@/lib/utils";

export function CartPageClient() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const total = subtotal();
  const count = items.reduce((n, i) => n + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={ShoppingBag}
          title={t("emptyTitle")}
          description={t("emptyHint")}
          action={
            <Link
              href="/products"
              className="inline-flex rounded-xl bg-warka-primary px-6 py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark"
            >
              {t("browseProducts")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-warka-bg pb-32 md:pb-16">
      <div className="border-b border-warka-border bg-gradient-to-b from-white to-warka-bg">
        <div className="page-container py-6 sm:py-8">
          <Link
            href="/products"
            className="text-body-sm mb-4 inline-flex items-center gap-2 font-medium text-warka-text-secondary hover:text-warka-primary"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t("continueShopping")}
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow">WARKA</p>
              <h1 className="page-title mt-1 font-display">{t("title")}</h1>
              <p className="page-description mt-2">
                {t("itemCount", { count })}
              </p>
            </div>
            <div className="hidden rounded-[var(--radius-card)] border border-warka-border bg-card px-5 py-3 shadow-card md:block">
              <p className="text-caption">{t("subtotal")}</p>
              <p className="text-price mt-0.5 text-xl text-warka-primary">{formatIqd(total, locale)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-6 sm:py-8">
        <section className="mb-6 sm:mb-8">
          <DeliveryDetailsForm locale={locale === "ar" ? "ar" : "en"} />
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            {items.map((line, index) => {
              const name = locale === "ar" ? line.name_ar : line.name_en;
              const lineTotal = line.unitPrice * line.quantity;

              return (
                <article
                  key={line.id}
                  className="group overflow-hidden rounded-2xl border border-warka-border bg-card shadow-card transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                    <div className="relative mx-auto aspect-[4/5] w-full max-w-[140px] shrink-0 overflow-hidden rounded-xl bg-media-bg sm:mx-0">
                      <Image
                        src={line.image}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="140px"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base font-bold text-warka-text">{name}</h2>
                          <p className="mt-1 text-sm font-semibold text-warka-primary">
                            {formatIqd(line.unitPrice, locale)}
                            <span className="font-normal text-warka-text-muted">
                              {" "}
                              / {locale === "ar" ? "قطعة" : "each"}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(line.id)}
                          className="rounded-lg p-2 text-warka-text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={t("remove")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {line.colorLabel && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-warka-border bg-warka-bg px-2.5 py-1 text-xs font-medium text-warka-text">
                            <span
                              className="size-3 rounded-full border border-warka-border"
                              style={{ backgroundColor: line.colorHex }}
                            />
                            <Palette className="size-3 text-warka-text-muted" />
                            {line.colorLabel}
                          </span>
                        )}
                        {line.fabricLabel && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-warka-border bg-warka-bg px-2.5 py-1 text-xs font-medium text-warka-text">
                            <Sparkles className="size-3 text-warka-primary" />
                            {line.fabricLabel}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 rounded-xl border border-warka-border bg-warka-bg/50 p-1">
                          <button
                            type="button"
                            disabled={line.quantity <= 1}
                            onClick={() => updateQuantity(line.id, line.quantity - 1)}
                            className="flex size-9 items-center justify-center rounded-lg text-warka-text hover:bg-card disabled:opacity-40"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-bold text-warka-text">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={line.quantity >= 99}
                            onClick={() => updateQuantity(line.id, line.quantity + 1)}
                            className="flex size-9 items-center justify-center rounded-lg text-warka-text hover:bg-card disabled:opacity-40"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <p className="text-base font-bold text-warka-text">
                          {formatIqd(lineTotal, locale)}
                        </p>
                      </div>

                      <Link
                        href={`/products/${line.catalogProductId}`}
                        className="mt-3 inline-block text-xs font-medium text-warka-primary hover:underline"
                      >
                        {t("editOptions")}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-warka-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
              <div className="border-b border-warka-border bg-gradient-to-br from-warka-primary/10 to-transparent px-6 py-5">
                <h2 className="text-lg font-bold text-warka-text">{t("orderSummary")}</h2>
                <p className="mt-1 text-xs text-warka-text-secondary">{t("summaryHint")}</p>
              </div>
              <div className="space-y-3 px-6 py-5">
                <div className="flex justify-between text-sm">
                  <span className="text-warka-text-secondary">{t("items")}</span>
                  <span className="font-medium text-warka-text">{count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warka-text-secondary">{t("subtotal")}</span>
                  <span className="font-medium text-warka-text">{formatIqd(total, locale)}</span>
                </div>
                <div className="border-t border-warka-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-warka-text">{t("total")}</span>
                    <span className="text-xl font-bold text-warka-primary">
                      {formatIqd(total, locale)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t border-warka-border bg-warka-bg/40 p-6">
                <button
                  type="button"
                  onClick={() => {
                    if (!isDeliveryComplete(useDeliveryStore.getState().details)) {
                      toast.error(
                        locale === "ar"
                          ? "أكمل عنوان التوصيل قبل المتابعة"
                          : "Complete delivery address before checkout"
                      );
                      return;
                    }
                    router.push("/checkout?from=cart");
                  }}
                  className={cn(
                    "w-full min-h-12 rounded-xl bg-warka-primary px-4 py-3.5 text-sm font-semibold text-white",
                    "shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all hover:bg-warka-primary-dark hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)]"
                  )}
                >
                  {t("checkout")}
                </button>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-warka-text-muted">
                  {t("customizeNext")}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-warka-border bg-card/95 p-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-warka-text-muted">{t("total")}</p>
            <p className="text-lg font-bold text-warka-primary">{formatIqd(total, locale)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isDeliveryComplete(useDeliveryStore.getState().details)) {
                toast.error(
                  locale === "ar"
                    ? "أكمل عنوان التوصيل قبل المتابعة"
                    : "Complete delivery address before checkout"
                );
                return;
              }
              router.push("/checkout?from=cart");
            }}
            className="min-h-12 shrink-0 rounded-xl bg-warka-primary px-6 py-3 text-sm font-semibold text-white whitespace-nowrap"
          >
            {t("checkout")}
          </button>
        </div>
      </div>
    </div>
  );
}
