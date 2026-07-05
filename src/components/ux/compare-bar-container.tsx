"use client";

import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { CompareBar } from "@/components/ux/compare-bar";
import { useCompareStore } from "@/stores/compare-store";

export function CompareBarContainer() {
  const locale = useLocale();
  const router = useRouter();
  const items = useCompareStore((s) => s.items);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const clearAll = useCompareStore((s) => s.clearAll);

  const isAr = locale === "ar";

  return (
    <CompareBar
      locale={isAr ? "ar" : "en"}
      items={items.map((p) => ({
        id: p.id,
        name: isAr ? p.name_ar : p.name_en,
        image: p.image,
      }))}
      onRemove={removeProduct}
      onClear={clearAll}
      onCompare={() => router.push("/compare")}
      className="bottom-above-mobile-nav md:bottom-0"
    />
  );
}
