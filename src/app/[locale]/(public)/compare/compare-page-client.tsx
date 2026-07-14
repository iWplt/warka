"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { GitCompareArrows, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WarkaCard } from "@/components/ui/warka-card";
import { Link } from "@/i18n/routing";
import { formatIqd } from "@/lib/format/currency";
import { MAX_COMPARE_ITEMS, useCompareStore } from "@/stores/compare-store";
import { cn } from "@/lib/utils";

const COMPARE_ROWS = [
  { key: "price", labelAr: "السعر", labelEn: "Price" },
  { key: "product_type", labelAr: "النوع", labelEn: "Type" },
  { key: "description", labelAr: "الوصف", labelEn: "Description" },
  { key: "colors", labelAr: "الألوان", labelEn: "Colors" },
  { key: "features", labelAr: "المميزات", labelEn: "Features" },
] as const;

export function ComparePageClient() {
  const locale = useLocale() as "ar" | "en";
  const isAr = locale === "ar";
  const items = useCompareStore((s) => s.items);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const clearAll = useCompareStore((s) => s.clearAll);

  const getCellValue = (key: (typeof COMPARE_ROWS)[number]["key"], index: number) => {
    const product = items[index];
    if (!product) return "—";

    switch (key) {
      case "price":
        return formatIqd(product.price, locale);
      case "product_type":
        return product.product_type;
      case "description":
        return isAr
          ? (product.description_ar ?? "—")
          : (product.description_en ?? "—");
      case "colors":
        return product.colors.length > 0 ? product.colors.join(", ") : "—";
      case "features":
        return product.features.length > 0 ? product.features.join(" · ") : "—";
      default:
        return "—";
    }
  };

  return (
    <div className="bg-warka-bg pb-24 md:pb-16">
      <div className="border-b border-warka-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-warka-text-muted">
            <Link href="/" className="hover:text-warka-text">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-warka-text-secondary">
              {isAr ? "مقارنة المنتجات" : "Compare products"}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <GitCompareArrows className="size-6 text-warka-primary sm:size-7" />
              {isAr ? "مقارنة المنتجات" : "Compare products"}
            </h1>
            <p className="page-description mt-1">
              {isAr
                ? `قارن حتى ${MAX_COMPARE_ITEMS} منتجات جنباً إلى جنب`
                : `Compare up to ${MAX_COMPARE_ITEMS} products side by side`}
            </p>
          </div>
          {items.length > 0 && (
            <Button type="button" variant="outline" onClick={clearAll} className="gap-2">
              <Trash2 className="size-4" />
              {isAr ? "مسح الكل" : "Clear all"}
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <WarkaCard className="py-16 text-center">
            <GitCompareArrows className="mx-auto mb-4 size-12 text-warka-text-muted/40" />
            <p className="mb-4 text-warka-text-secondary">
              {isAr
                ? "لم تضف منتجات للمقارنة بعد. تصفّح المنتجات واختر ما يصل إلى 3."
                : "No products to compare yet. Browse products and select up to 3."}
            </p>
            <Button asChild>
              <Link href="/products">{isAr ? "تصفح المنتجات" : "Browse products"}</Link>
            </Button>
          </WarkaCard>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className="w-36 border border-warka-border bg-warka-bg/60 p-3 text-start text-sm font-semibold text-warka-text-secondary">
                    {isAr ? "المواصفة" : "Spec"}
                  </th>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, index) => {
                    const product = items[index];
                    return (
                      <th
                        key={index}
                        className={cn(
                          "min-w-[180px] border border-warka-border bg-card p-3 align-top",
                          !product && "bg-warka-bg/20"
                        )}
                      >
                        {product ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative size-20 overflow-hidden rounded-xl bg-media-bg">
                              <Image
                                src={product.image}
                                alt={isAr ? product.name_ar : product.name_en}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>
                            <p className="text-center text-sm font-bold text-warka-text">
                              {isAr ? product.name_ar : product.name_en}
                            </p>
                            <div className="flex gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/products/${product.id}`}>
                                  {isAr ? "عرض" : "View"}
                                </Link>
                              </Button>
                              <button
                                type="button"
                                onClick={() => removeProduct(product.id)}
                                className="flex size-8 items-center justify-center rounded-lg border border-warka-border text-warka-text-muted hover:bg-warka-bg hover:text-warka-text"
                                aria-label={isAr ? "إزالة" : "Remove"}
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-warka-text-muted">
                            {isAr ? "فارغ" : "Empty"}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.key}>
                    <td className="border border-warka-border bg-warka-bg/40 p-3 text-sm font-semibold text-warka-text">
                      {isAr ? row.labelAr : row.labelEn}
                    </td>
                    {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, index) => (
                      <td
                        key={index}
                        className="border border-warka-border bg-card p-3 text-sm text-warka-text-secondary"
                      >
                        {getCellValue(row.key, index)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
