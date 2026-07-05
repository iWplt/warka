"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteSizeGuideEntry,
  upsertSizeGuideEntry,
} from "@/server/actions/settings";
import type { SizeGuideEntry } from "@/lib/settings/types";
import type { ProductType } from "@/types/database";

const PRODUCT_TYPES: (ProductType | "")[] = ["", "sash", "cap", "gown", "suit", "custom"];

const STANDARD_PRESETS = [
  { code: "S", minH: 140, maxH: 165, minW: 40, maxW: 58, order: 1 },
  { code: "M", minH: 163, maxH: 175, minW: 50, maxW: 72, order: 2 },
  { code: "L", minH: 173, maxH: 185, minW: 60, maxW: 88, order: 3 },
  { code: "XL", minH: 180, maxH: 195, minW: 75, maxW: 100, order: 4 },
  { code: "XXL", minH: 188, maxH: 210, minW: 85, maxW: 140, order: 5 },
];

type SizeGuideManagerProps = {
  entries: SizeGuideEntry[];
};

function emptyDraft(): Partial<SizeGuideEntry> {
  return {
    product_type: "gown",
    size_code: "",
    label_ar: "",
    label_en: "",
    min_height_cm: null,
    max_height_cm: null,
    min_weight_kg: null,
    max_weight_kg: null,
    sort_order: 0,
    is_active: true,
  };
}

export function SizeGuideManager({ entries }: SizeGuideManagerProps) {
  const t = useTranslations("adminSizes");
  const productT = useTranslations("productType");
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);

  const productLabel = (type: ProductType | null | undefined) => {
    if (!type) return t("allProducts");
    return productT(type);
  };

  const handleSave = async () => {
    if (!draft.size_code || !draft.label_ar || !draft.label_en) {
      toast.error(t("requiredFields"));
      return;
    }
    setSaving(true);
    try {
      await upsertSizeGuideEntry({
        id: draft.id,
        product_type: draft.product_type || null,
        size_code: draft.size_code,
        label_ar: draft.label_ar,
        label_en: draft.label_en,
        min_height_cm: draft.min_height_cm,
        max_height_cm: draft.max_height_cm,
        min_weight_kg: draft.min_weight_kg,
        max_weight_kg: draft.max_weight_kg,
        sort_order: draft.sort_order,
        is_active: draft.is_active,
      });
      toast.success(t("saved"));
      setDraft(emptyDraft());
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteSizeGuideEntry(id);
      toast.success(t("deleted"));
      router.refresh();
    } catch {
      toast.error(t("error"));
    }
  };

  const fillStandardSet = () => {
    const type = (draft.product_type || "gown") as ProductType;
    const first = STANDARD_PRESETS[0];
    setDraft({
      product_type: type,
      size_code: first.code,
      label_ar: first.code,
      label_en: first.code,
      min_height_cm: first.minH,
      max_height_cm: first.maxH,
      min_weight_kg: first.minW,
      max_weight_kg: first.maxW,
      sort_order: first.order,
      is_active: true,
    });
    toast.info(t("standardSetAdded"));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={fillStandardSet}>
          {t("addStandardSet")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-glass-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-foreground/5 text-start">
            <tr>
              <th className="px-3 py-2">{t("product")}</th>
              <th className="px-3 py-2">{t("code")}</th>
              <th className="px-3 py-2">{t("labelAr")}</th>
              <th className="px-3 py-2">{t("height")}</th>
              <th className="px-3 py-2">{t("weight")}</th>
              <th className="px-3 py-2">{t("order")}</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-glass-border">
                <td className="px-3 py-2">{productLabel(entry.product_type)}</td>
                <td className="px-3 py-2 font-mono font-bold">{entry.size_code.toUpperCase()}</td>
                <td className="px-3 py-2">{isAr ? entry.label_ar : entry.label_en}</td>
                <td className="px-3 py-2">
                  {entry.min_height_cm ?? "—"}–{entry.max_height_cm ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {entry.min_weight_kg ?? "—"}–{entry.max_weight_kg ?? "—"}
                </td>
                <td className="px-3 py-2">{entry.sort_order}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setDraft(entry)}>
                      {t("edit")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void handleDelete(entry.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-glass-border bg-foreground/5 p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Plus className="size-4" />
          {draft.id ? t("editEntry") : t("addEntry")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("productType")}>
            <select
              className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
              value={draft.product_type ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  product_type: (e.target.value || null) as ProductType | null,
                }))
              }
            >
              {PRODUCT_TYPES.map((pt) => (
                <option key={pt || "all"} value={pt}>
                  {productLabel(pt || null)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("sizeCode")}>
            <input
              className="w-full rounded-lg border border-glass-border bg-card px-3 py-2 font-bold uppercase"
              value={draft.size_code ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, size_code: e.target.value.toUpperCase() }))}
              placeholder="S, M, L, XL…"
            />
          </Field>
          <Field label={t("sortOrder")}>
            <input
              type="number"
              className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
              value={draft.sort_order ?? 0}
              onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))}
            />
          </Field>
          <Field label={t("labelAr")}>
            <input
              className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
              value={draft.label_ar ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, label_ar: e.target.value }))}
            />
          </Field>
          <Field label={t("labelEn")}>
            <input
              className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
              value={draft.label_en ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, label_en: e.target.value }))}
            />
          </Field>
          <Field label={t("minHeight")}>
            <input
              type="number"
              className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
              value={draft.min_height_cm ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  min_height_cm: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </Field>
          <Field label={t("maxHeight")}>
            <input
              type="number"
              className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
              value={draft.max_height_cm ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  max_height_cm: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </Field>
          <Field label={t("minWeight")}>
            <input
              type="number"
              className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
              value={draft.min_weight_kg ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  min_weight_kg: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </Field>
          <Field label={t("maxWeight")}>
            <input
              type="number"
              className="w-full rounded-lg border border-glass-border bg-card px-3 py-2"
              value={draft.max_weight_kg ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  max_weight_kg: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? t("saving") : t("saveEntry")}
          </Button>
          {draft.id && (
            <Button variant="ghost" onClick={() => setDraft(emptyDraft())}>
              {t("cancelEdit")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
