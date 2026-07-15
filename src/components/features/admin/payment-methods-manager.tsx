"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PaymentMethodLogo } from "@/components/payment/payment-method-logos";
import { iraqiPaymentLabel } from "@/lib/payment/iraqi-methods";
import type {
  PaymentMethodConfig,
  PaymentMethodSettings,
} from "@/lib/payment/payment-method-settings";
import { updatePaymentMethodSettings } from "@/server/actions/settings";
import { cn } from "@/lib/utils";

type PaymentMethodsManagerProps = {
  settings: PaymentMethodSettings;
};

export function PaymentMethodsManager({ settings }: PaymentMethodsManagerProps) {
  const t = useTranslations("adminPaymentMethods");
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [draft, setDraft] = useState<PaymentMethodConfig[]>(settings.methods);
  const [saving, setSaving] = useState(false);

  const updateMethod = (
    id: PaymentMethodConfig["id"],
    patch: Partial<PaymentMethodConfig>
  ) => {
    setDraft((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePaymentMethodSettings({ methods: draft });
      toast.success(t("saved"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-section">
      <div className="space-y-4">
        {draft.map((method) => (
          <article
            key={method.id}
            className={cn(
              "rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5",
              !method.is_active && "opacity-70"
            )}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PaymentMethodLogo method={method.id} size="lg" />
                <div>
                  <h2 className="text-base font-bold text-warka-text">
                    {iraqiPaymentLabel(method.id, isAr)}
                  </h2>
                  <p className="text-xs text-warka-text-muted">
                    {method.is_active ? t("statusActive") : t("statusInactive")}
                  </p>
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-warka-text">
                <input
                  type="checkbox"
                  className="size-4 rounded border-warka-border accent-warka-primary"
                  checked={method.is_active}
                  onChange={(e) => updateMethod(method.id, { is_active: e.target.checked })}
                />
                {t("active")}
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">{t("phone")}</span>
                <input
                  type="text"
                  inputMode="tel"
                  className="w-full rounded-xl border border-glass-border bg-card px-4 py-2.5"
                  value={method.phone}
                  placeholder={t("phonePlaceholder")}
                  onChange={(e) => updateMethod(method.id, { phone: e.target.value })}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">{t("accountNumber")}</span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-glass-border bg-card px-4 py-2.5"
                  value={method.account_number}
                  placeholder={t("accountPlaceholder")}
                  onChange={(e) =>
                    updateMethod(method.id, { account_number: e.target.value })
                  }
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">{t("cardNumber")}</span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-glass-border bg-card px-4 py-2.5"
                  value={method.card_number}
                  placeholder={t("cardPlaceholder")}
                  onChange={(e) => updateMethod(method.id, { card_number: e.target.value })}
                />
              </label>

              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-muted-foreground">{t("notes")}</span>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-glass-border bg-card px-4 py-2.5"
                  value={method.notes}
                  placeholder={t("notesPlaceholder")}
                  onChange={(e) => updateMethod(method.id, { notes: e.target.value })}
                />
              </label>
            </div>
          </article>
        ))}
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button
          size="lg"
          className="min-h-11 px-8 shadow-lg"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
