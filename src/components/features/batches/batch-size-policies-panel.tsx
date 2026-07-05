"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateBatchSettingsAction } from "@/server/actions/batches";
import { OPEN_SIZE_POLICIES } from "@/lib/settings/size-policies";
import type { ProductSizeMode, ProductSizePolicy } from "@/lib/settings/size-policies";
import type { BatchSettings } from "@/lib/settings/types";
import type { Batch, ProductType } from "@/types/database";

const PRODUCT_TYPES: ProductType[] = ["sash", "cap", "gown", "suit", "custom"];

const MODE_OPTIONS: { value: ProductSizeMode; ar: string; en: string }[] = [
  { value: "one_size", ar: "مقاس واحد (موحّد)", en: "One size (fixed)" },
  { value: "fixed_list", ar: "مقاسات ثابتة من الدليل", en: "Fixed sizes from guide" },
  { value: "estimate", ar: "تخمين فقط (طول/وزن)", en: "Estimate only (height/weight)" },
  { value: "fixed_and_estimate", ar: "ثابت + تخمين", en: "Fixed + estimate" },
  { value: "custom", ar: "قياس مخصص فقط", en: "Custom measurements only" },
  { value: "fixed_and_custom", ar: "ثابت + قياس مخصص", en: "Fixed + custom" },
];

type BatchSizePoliciesPanelProps = {
  batch: Batch;
  isAdmin: boolean;
};

function initialDraft(settings: BatchSettings): Partial<Record<ProductType, ProductSizePolicy>> {
  const existing = settings.size_policies ?? {};
  const draft: Partial<Record<ProductType, ProductSizePolicy>> = {};
  for (const pt of PRODUCT_TYPES) {
    draft[pt] = {
      ...OPEN_SIZE_POLICIES[pt],
      ...(existing[pt] ?? {}),
      product_type: pt,
    };
  }
  return draft;
}

export function BatchSizePoliciesPanel({ batch, isAdmin }: BatchSizePoliciesPanelProps) {
  const t = useTranslations("batches");
  const productT = useTranslations("productType");
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const settings = (batch.settings ?? {}) as BatchSettings;
  const [enabled, setEnabled] = useState(Boolean(settings.size_policies));
  const [draft, setDraft] = useState(() => initialDraft(settings));
  const [saving, setSaving] = useState(false);

  const setPolicy = (type: ProductType, patch: Partial<ProductSizePolicy>) => {
    setDraft((prev) => ({
      ...prev,
      [type]: { ...prev[type]!, ...patch, product_type: type },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBatchSettingsAction({
        batch_id: batch.id,
        settings: {
          size_policies: enabled ? draft : null,
        },
      });
      toast.success(t("sizePolicies.saved"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sizePolicies.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-glass-border glass p-5">
      <div className="mb-3 flex items-start gap-3">
        <Ruler className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <h3 className="font-semibold">{t("sizePolicies.title")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("sizePolicies.hint")}</p>
        </div>
      </div>

      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          disabled={!isAdmin}
        />
        {t("sizePolicies.enableBatchRules")}
      </label>

      {enabled && (
        <div className="space-y-3">
          {PRODUCT_TYPES.map((type) => {
            const p = draft[type]!;
            return (
              <div
                key={type}
                className="rounded-xl border border-glass-border bg-foreground/[0.02] p-4"
              >
                <p className="mb-3 font-semibold">{productT(type)}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted-foreground">{t("sizePolicies.mode")}</span>
                    <select
                      className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
                      value={p.mode}
                      onChange={(e) =>
                        setPolicy(type, { mode: e.target.value as ProductSizeMode })
                      }
                      disabled={!isAdmin}
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
                        <span className="mb-1 block text-muted-foreground">{t("sizePolicies.oneSizeAr")}</span>
                        <input
                          className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
                          value={p.one_size_label_ar}
                          onChange={(e) =>
                            setPolicy(type, { one_size_label_ar: e.target.value })
                          }
                          disabled={!isAdmin}
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-muted-foreground">{t("sizePolicies.oneSizeEn")}</span>
                        <input
                          className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
                          value={p.one_size_label_en}
                          onChange={(e) =>
                            setPolicy(type, { one_size_label_en: e.target.value })
                          }
                          disabled={!isAdmin}
                        />
                      </label>
                    </>
                  )}
                  <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
                    <input
                      type="checkbox"
                      checked={p.allow_estimate}
                      onChange={(e) => setPolicy(type, { allow_estimate: e.target.checked })}
                      disabled={!isAdmin}
                    />
                    {t("sizePolicies.allowEstimate")}
                  </label>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
                    <input
                      type="checkbox"
                      checked={p.allow_custom_measurements}
                      onChange={(e) =>
                        setPolicy(type, { allow_custom_measurements: e.target.checked })
                      }
                      disabled={!isAdmin}
                    />
                    {t("sizePolicies.allowCustom")}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!enabled && (
        <p className="rounded-lg border border-dashed border-glass-border px-4 py-3 text-sm text-muted-foreground">
          {t("sizePolicies.openDefault")}
        </p>
      )}

      {isAdmin && (
        <Button type="button" className="mt-4" variant="secondary" disabled={saving} onClick={handleSave}>
          {saving ? t("sizePolicies.saving") : t("sizePolicies.save")}
        </Button>
      )}
    </div>
  );
}
