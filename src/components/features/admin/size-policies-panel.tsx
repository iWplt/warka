"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateSizePolicies } from "@/server/actions/settings";
import type { ProductSizePolicy, ProductSizeMode } from "@/lib/settings/size-policies";
import type { ProductType } from "@/types/database";

const PRODUCT_TYPES: ProductType[] = ["sash", "cap", "gown", "suit", "custom"];

const MODE_OPTIONS: { value: ProductSizeMode; ar: string; en: string }[] = [
  { value: "one_size", ar: "مقاس واحد (موحّد)", en: "One size (fixed)" },
  { value: "fixed_list", ar: "مقاسات ثابتة من الدليل", en: "Fixed sizes from guide" },
  { value: "estimate", ar: "تخمين فقط (طول/وزن)", en: "Estimate only (height/weight)" },
  { value: "fixed_and_estimate", ar: "ثابت + تخمين", en: "Fixed + estimate" },
  { value: "custom", ar: "قياس مخصص فقط", en: "Custom measurements only" },
  { value: "fixed_and_custom", ar: "ثابت + قياس مخصص", en: "Fixed + custom" },
];

type SizePoliciesPanelProps = {
  policies: Record<ProductType, ProductSizePolicy>;
};

export function SizePoliciesPanel({ policies }: SizePoliciesPanelProps) {
  const t = useTranslations("adminSizes");
  const productT = useTranslations("productType");
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [draft, setDraft] = useState(() => ({ ...policies }));
  const [saving, setSaving] = useState(false);

  const setPolicy = (type: ProductType, patch: Partial<ProductSizePolicy>) => {
    setDraft((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...patch },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSizePolicies(PRODUCT_TYPES.map((pt) => draft[pt]));
      toast.success(t("policiesSaved"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {PRODUCT_TYPES.map((type) => {
          const p = draft[type];
          return (
            <div
              key={type}
              className="rounded-xl border border-glass-border bg-foreground/[0.02] p-4"
            >
              <p className="mb-3 font-semibold">{productT(type)}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">{t("mode")}</span>
                  <select
                    className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
                    value={p.mode}
                    onChange={(e) =>
                      setPolicy(type, { mode: e.target.value as ProductSizeMode })
                    }
                  >
                    {MODE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {isAr ? o.ar : o.en}
                      </option>
                    ))}
                  </select>
                </label>
                {p.mode === "one_size" && (
                  <>
                    <label className="block text-sm">
                      <span className="mb-1 block text-muted-foreground">{t("oneSizeLabelAr")}</span>
                      <input
                        className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
                        value={p.one_size_label_ar}
                        onChange={(e) =>
                          setPolicy(type, { one_size_label_ar: e.target.value })
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-muted-foreground">{t("oneSizeLabelEn")}</span>
                      <input
                        className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
                        value={p.one_size_label_en}
                        onChange={(e) =>
                          setPolicy(type, { one_size_label_en: e.target.value })
                        }
                      />
                    </label>
                  </>
                )}
                <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
                  <input
                    type="checkbox"
                    checked={p.allow_estimate}
                    onChange={(e) => setPolicy(type, { allow_estimate: e.target.checked })}
                  />
                  {t("allowEstimate")}
                </label>
                <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
                  <input
                    type="checkbox"
                    checked={p.allow_custom_measurements}
                    onChange={(e) =>
                      setPolicy(type, { allow_custom_measurements: e.target.checked })
                    }
                  />
                  {t("allowCustom")}
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <Button onClick={() => void handleSave()} disabled={saving}>
        {saving ? t("saving") : t("savePolicies")}
      </Button>
    </div>
  );
}
