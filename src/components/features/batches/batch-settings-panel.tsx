"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBatchSettingsAction } from "@/server/actions/batches";
import { DEFAULT_BATCH_DEFAULTS } from "@/lib/settings/types";
import type { Batch } from "@/types/database";
import type { BatchSettings } from "@/lib/settings/types";

type BatchSettingsPanelProps = {
  batch: Batch;
  isAdmin: boolean;
};

export function BatchSettingsPanel({ batch, isAdmin }: BatchSettingsPanelProps) {
  const t = useTranslations("batches");
  const router = useRouter();
  const settings = (batch.settings ?? {}) as BatchSettings;
  const defaults = settings.defaults ?? {};
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sash_color: String(defaults.sash_color ?? ""),
    fabric_type: String(defaults.fabric_type ?? ""),
    cap_type: String(defaults.cap_type ?? ""),
    embroidery_style: String(defaults.embroidery_style ?? ""),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBatchSettingsAction({
        batch_id: batch.id,
        settings: {
          locked_fields: isAdmin
            ? settings.locked_fields ?? DEFAULT_BATCH_DEFAULTS.admin_locked_fields
            : undefined,
          editable_fields:
            settings.editable_fields ?? DEFAULT_BATCH_DEFAULTS.rep_editable_fields,
          defaults: {
            sash_color: form.sash_color || undefined,
            fabric_type: form.fabric_type || undefined,
            cap_type: form.cap_type || undefined,
            embroidery_style: form.embroidery_style || undefined,
          },
        },
      });
      toast.success(isAdmin ? t("defaults.savedAdmin") : t("defaults.savedRep"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("defaults.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-glass-border glass p-5">
      <h3 className="mb-1 font-semibold">
        {isAdmin ? t("defaults.titleAdmin") : t("defaults.titleRep")}
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {isAdmin ? t("defaults.hintAdmin") : t("defaults.hintRep")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs">{t("defaults.sashColor")}</Label>
          <Input
            value={form.sash_color}
            onChange={(e) => setForm({ ...form, sash_color: e.target.value })}
            disabled={!isAdmin}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">{t("defaults.fabricType")}</Label>
          <Input
            value={form.fabric_type}
            onChange={(e) => setForm({ ...form, fabric_type: e.target.value })}
            disabled={!isAdmin}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">{t("defaults.capType")}</Label>
          <Input
            value={form.cap_type}
            onChange={(e) => setForm({ ...form, cap_type: e.target.value })}
            disabled={!isAdmin}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">{t("defaults.embroideryStyle")}</Label>
          <Input
            value={form.embroidery_style}
            onChange={(e) => setForm({ ...form, embroidery_style: e.target.value })}
            disabled={!isAdmin}
            className="mt-1"
          />
        </div>
      </div>
      {isAdmin && (
        <Button type="button" className="mt-4" variant="secondary" disabled={saving} onClick={handleSave}>
          {saving ? t("defaults.saving") : t("defaults.save")}
        </Button>
      )}
    </div>
  );
}
