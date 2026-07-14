"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, GitCompareArrows, Palette, Zap } from "lucide-react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { QuickViewModal } from "@/components/ux/quick-view-modal";
import {
  getFabricSummary,
  getShortDescription,
  getStartingPrice,
} from "@/lib/products/card-summary";
import { formatIqd } from "@/lib/format/currency";
import type { Product } from "@/types/database";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  locale: "ar" | "en";
  categoryLabel?: string;
  compareChecked?: boolean;
  onCompareChange?: (checked: boolean, product: Product) => void;
  compareDisabled?: boolean;
  className?: string;
  detailHref?: string;
  isAuthenticated?: boolean;
};

export function ProductCard({
  product,
  locale,
  categoryLabel,
  compareChecked = false,
  onCompareChange,
  compareDisabled,
  className,
  detailHref,
  isAuthenticated = false,
}: ProductCardProps) {
  const isAr = locale === "ar";
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const compareActive = mounted && compareChecked;

  const name = isAr ? product.name_ar : product.name_en;
  const isCustom = product.product_type === "custom";
  const image = product.image ?? "/assets/landing/product-sash.jpg";
  const href = detailHref ?? `/products/${product.id}`;
  const shortDesc = getShortDescription(product, locale);
  const fabricSummary = getFabricSummary(product, locale);
  const price = getStartingPrice(product);

  const orderHref = href;

  const handleCompareToggle = () => {
    if (!onCompareChange) return;
    const next = !compareChecked;
    if (next && compareDisabled) {
      toast.error(isAr ? "يمكنك مقارنة 3 منتجات كحد أقصى" : "You can compare up to 3 products");
      return;
    }
    onCompareChange(next, product);
  };

  return (
    <>
      <article
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-xl border border-warka-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] sm:rounded-2xl",
          className
        )}
      >
        <div className="absolute start-3 top-3 z-10 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {onCompareChange && (
            <label
              className={cn(
                "flex size-9 cursor-pointer items-center justify-center rounded-full border border-warka-border bg-card/95 shadow-sm transition-colors",
                compareActive && "border-warka-primary bg-warka-primary/10 text-warka-primary"
              )}
              title={isAr ? "مقارنة" : "Compare"}
            >
              <input
                type="checkbox"
                checked={compareActive}
                onChange={handleCompareToggle}
                className="sr-only"
              />
              <GitCompareArrows className="size-4" />
            </label>
          )}
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            className="flex size-9 items-center justify-center rounded-full border border-warka-border bg-card/95 text-warka-text shadow-sm transition-colors hover:border-warka-primary hover:text-warka-primary"
            aria-label={isAr ? "معاينة سريعة" : "Quick view"}
          >
            <Eye className="size-4" />
          </button>
        </div>

        <Link href={href} className="block shrink-0">
          {isCustom && !product.image ? (
            <div className="flex aspect-[4/3] items-center justify-center border-b border-warka-border bg-warka-bg">
              <Palette className="h-10 w-10 text-warka-primary" />
            </div>
          ) : (
            <div className="relative aspect-[4/3] overflow-hidden bg-media-bg">
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-3.5 sm:p-5">
          {categoryLabel && (
            <p className="text-caption hidden uppercase tracking-wide text-warka-primary sm:block">
              {categoryLabel}
            </p>
          )}
          <Link href={href}>
            <h3 className="section-title mt-0 line-clamp-2 transition-colors group-hover:text-warka-primary sm:mt-1">
              {name}
            </h3>
          </Link>

          <p className="text-body-sm mt-1.5 line-clamp-2 sm:mt-2">
            {shortDesc}
          </p>

          {fabricSummary && (
            <p className="text-caption mt-1.5 hidden sm:mt-2 sm:block">
              {isAr ? "الأقمشة:" : "Fabrics:"} {fabricSummary}
            </p>
          )}

          <p className="text-price mt-2.5 text-base text-warka-primary sm:mt-3 sm:text-lg">
            {isCustom && !product.price
              ? isAr
                ? "حسب الطلب"
                : "Custom quote"
              : formatIqd(price, locale)}
          </p>

          <div className="mt-auto space-y-2 pt-3 sm:pt-4">
            <Link
              href={href}
              className="block w-full rounded-lg border border-warka-primary py-2.5 text-center text-sm font-semibold text-warka-primary transition-colors hover:bg-warka-primary/5"
            >
              {isAr ? "عرض التفاصيل" : "View details"}
            </Link>
            <Link
              href={orderHref}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-warka-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark"
            >
              <Zap className="size-4" />
              {isAr ? "اطلب الآن" : "Order now"}
            </Link>
          </div>
        </div>
      </article>

      <QuickViewModal
        product={product}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        locale={locale}
        categoryLabel={categoryLabel}
      />
    </>
  );
}
