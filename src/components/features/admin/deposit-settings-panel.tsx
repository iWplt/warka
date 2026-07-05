"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateDepositSettings } from "@/server/actions/settings";
import type { DepositSettings } from "@/lib/settings/types";

type DepositSettingsPanelProps = {
  settings: DepositSettings;
};

export function DepositSettingsPanel({ settings }: DepositSettingsPanelProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDepositSettings(draft);
      toast.success("Deposit settings saved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Deposit mode</span>
          <select
            className="w-full rounded-xl border border-glass-border bg-card px-4 py-2"
            value={draft.mode}
            onChange={(e) =>
              setDraft((d) => ({ ...d, mode: e.target.value as DepositSettings["mode"] }))
            }
          >
            <option value="percentage">Percentage of total</option>
            <option value="fixed">Fixed amount (IQD)</option>
          </select>
        </label>

        {draft.mode === "percentage" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Percentage (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded-xl border border-glass-border bg-card px-4 py-2"
              value={draft.percentage}
              onChange={(e) => setDraft((d) => ({ ...d, percentage: Number(e.target.value) }))}
            />
          </label>
        ) : (
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Fixed deposit (IQD)</span>
            <input
              type="number"
              min={0}
              className="w-full rounded-xl border border-glass-border bg-card px-4 py-2"
              value={draft.fixed_amount}
              onChange={(e) => setDraft((d) => ({ ...d, fixed_amount: Number(e.target.value) }))}
            />
          </label>
        )}

        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-muted-foreground">Minimum deposit (IQD, optional)</span>
          <input
            type="number"
            min={0}
            className="w-full rounded-xl border border-glass-border bg-card px-4 py-2"
            value={draft.min_deposit_iqd}
            onChange={(e) => setDraft((d) => ({ ...d, min_deposit_iqd: Number(e.target.value) }))}
          />
        </label>
      </div>

      <Button onClick={() => void handleSave()} disabled={saving}>
        {saving ? "Saving…" : "Save deposit settings"}
      </Button>
    </div>
  );
}
