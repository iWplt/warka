"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type CatalogPaginationProps = {
  page: number;
  totalPages: number;
  baseHref: string;
  locale: "ar" | "en";
  className?: string;
  onPageChange?: (page: number) => void;
};

export function CatalogPagination({
  page,
  totalPages,
  baseHref,
  locale,
  className,
  onPageChange,
}: CatalogPaginationProps) {
  const isAr = locale === "ar";
  if (totalPages <= 1) return null;

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  const prevClassName =
    "inline-flex min-h-10 items-center gap-1 rounded-xl border border-warka-border bg-card px-3 py-2 text-sm font-medium text-warka-text transition-colors hover:bg-warka-bg";
  const disabledClassName =
    "inline-flex min-h-10 items-center gap-1 rounded-xl border border-warka-border/50 px-3 py-2 text-sm text-warka-text-muted opacity-50";

  return (
    <nav
      className={cn("flex items-center justify-center gap-3", className)}
      aria-label={isAr ? "صفحات المنتجات" : "Product pages"}
    >
      {prevPage ? (
        onPageChange ? (
          <button type="button" onClick={() => onPageChange(prevPage)} className={prevClassName}>
            <ChevronRight className="size-4" />
            {isAr ? "السابق" : "Previous"}
          </button>
        ) : (
          <Link href={`${baseHref}?page=${prevPage}`} className={prevClassName}>
            <ChevronRight className="size-4" />
            {isAr ? "السابق" : "Previous"}
          </Link>
        )
      ) : (
        <span className={disabledClassName}>
          <ChevronRight className="size-4" />
          {isAr ? "السابق" : "Previous"}
        </span>
      )}

      <span className="text-sm font-medium text-warka-text-secondary">
        {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
      </span>

      {nextPage ? (
        onPageChange ? (
          <button type="button" onClick={() => onPageChange(nextPage)} className={prevClassName}>
            {isAr ? "التالي" : "Next"}
            <ChevronLeft className="size-4" />
          </button>
        ) : (
          <Link href={`${baseHref}?page=${nextPage}`} className={prevClassName}>
            {isAr ? "التالي" : "Next"}
            <ChevronLeft className="size-4" />
          </Link>
        )
      ) : (
        <span className={disabledClassName}>
          {isAr ? "التالي" : "Next"}
          <ChevronLeft className="size-4" />
        </span>
      )}
    </nav>
  );
}
