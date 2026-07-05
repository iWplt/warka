"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProductEmbroideryPositions } from "@/server/actions/settings";
import { parseEmbroideryPositions } from "@/lib/products/variants";
import type { EmbroideryPosition, Product } from "@/types/database";

type EmbroideryPositionsAdminProps = {
  product: Product;
};

export function EmbroideryPositionsAdmin({ product }: EmbroideryPositionsAdminProps) {
  const t = useTranslations("adminEmbroidery");
  const router = useRouter();
  const [positions, setPositions] = useState<EmbroideryPosition[]>(
    parseEmbroideryPositions(product.embroidery_positions ?? [])
  );
  const [saving, setSaving] = useState(false);

  const addPosition = () => {
    setPositions((prev) => [
      ...prev,
      {
        key: `pos-${Date.now()}`,
        label_ar: "",
        label_en: "",
        sort_order: prev.length,
        is_active: true,
      },
    ]);
  };

  const save = async () => {
    const valid = positions.filter((p) => p.key && p.label_ar);
    if (valid.length === 0 && positions.length > 0) {
      toast.error(t("required"));
      return;
    }
    setSaving(true);
    try {
      await updateProductEmbroideryPositions(product.id, valid);
      toast.success(t("saved"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-glass-border bg-foreground/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-warka-primary" />
        <h4 className="font-semibold">{t("title")}</h4>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{t("hint")}</p>

      <div className="space-y-3">
        {positions.map((pos, index) => (
          <div key={pos.key + index} className="grid gap-2 sm:grid-cols-4">
            <input
              placeholder={t("keyPlaceholder")}
              className="rounded-lg border border-glass-border bg-card px-3 py-2 font-mono text-sm"
              value={pos.key}
              onChange={(e) =>
                setPositions((prev) =>
                  prev.map((p, i) => (i === index ? { ...p, key: e.target.value } : p))
                )
              }
            />
            <input
              placeholder={t("labelArPlaceholder")}
              className="rounded-lg border border-glass-border bg-card px-3 py-2 text-sm"
              value={pos.label_ar}
              onChange={(e) =>
                setPositions((prev) =>
                  prev.map((p, i) => (i === index ? { ...p, label_ar: e.target.value } : p))
                )
              }
            />
            <input
              placeholder={t("labelEnPlaceholder")}
              className="rounded-lg border border-glass-border bg-card px-3 py-2 text-sm"
              value={pos.label_en}
              onChange={(e) =>
                setPositions((prev) =>
                  prev.map((p, i) => (i === index ? { ...p, label_en: e.target.value } : p))
                )
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPositions((prev) => prev.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addPosition}>
          <Plus className="size-4" />
          {t("addPosition")}
        </Button>
        <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
