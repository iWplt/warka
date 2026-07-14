"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter, Link } from "@/i18n/routing";
import { Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePriceCatalog } from "@/server/actions/payments";
import { DepositSettingsPanel } from "@/components/features/admin/deposit-settings-panel";
import {
  MessageTemplatesPanel,
  MessagingSettingsPanel,
  NotificationLogPanel,
} from "@/components/features/admin/messaging-settings-panel";
import type { MessagingSettings } from "@/lib/messaging/settings";
import type { DepositSettings } from "@/lib/settings/types";
import type { MessageTemplate, NotificationLog, PriceCatalogItem } from "@/types/database";

type SettingsViewProps = {
  prices: PriceCatalogItem[];
  depositSettings: DepositSettings;
  messagingSettings: MessagingSettings;
  messageTemplates: MessageTemplate[];
  notificationLogs: NotificationLog[];
  whatsappConfigured: boolean;
  whatsappProvider: string;
};

export function SettingsView({
  prices,
  depositSettings,
  messagingSettings,
  messageTemplates,
  notificationLogs,
  whatsappConfigured,
  whatsappProvider,
}: SettingsViewProps) {
  const t = useTranslations("adminSettings");
  const productT = useTranslations("productType");
  const router = useRouter();

  const handleUpdate = async (id: string, base_price: number) => {
    try {
      await updatePriceCatalog(id, { base_price });
      toast.success(t("updated"));
      router.refresh();
    } catch {
      toast.error(t("error"));
    }
  };

  return (
    <div className="stack-section">
      <div className="rounded-[var(--radius-card)] border border-warka-primary/20 bg-warka-primary/5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Ruler className="size-5 text-warka-primary" />
              {t("sizesLink")}
            </h2>
            <p className="page-description mt-1">{t("sizesLinkHint")}</p>
          </div>
          <Button asChild variant="accent">
            <Link href="/admin/sizes">{t("openSizes")}</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
        <h2 className="section-title mb-4">{t("priceCatalog")}</h2>
        <div className="space-y-4">
          {prices.map((item) => (
            <PriceRow
              key={item.id}
              item={item}
              label={productT(item.product_type)}
              saveLabel={t("save")}
              onSave={handleUpdate}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="mb-4 font-semibold">{t("deposit")}</h2>
        <DepositSettingsPanel settings={depositSettings} />
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="mb-4 font-semibold">{t("whatsapp")}</h2>
        <MessagingSettingsPanel
          settings={messagingSettings}
          providerConfigured={whatsappConfigured}
          providerName={whatsappProvider}
        />
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="mb-4 font-semibold">{t("messageTemplates")}</h2>
        <MessageTemplatesPanel templates={messageTemplates} />
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="mb-4 font-semibold">{t("notificationLog")}</h2>
        <NotificationLogPanel logs={notificationLogs} />
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="mb-2 font-semibold">{t("backup")}</h2>
        <p className="text-sm text-muted-foreground">{t("backupHint")}</p>
      </div>
    </div>
  );
}

function PriceRow({
  item,
  label,
  saveLabel,
  onSave,
}: {
  item: PriceCatalogItem;
  label: string;
  saveLabel: string;
  onSave: (id: string, price: number) => void;
}) {
  const [price, setPrice] = useState(String(item.base_price));

  return (
    <div className="flex items-center gap-4">
      <span className="w-40 font-medium">{label}</span>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="flex-1 rounded-xl border border-glass-border bg-foreground/5 px-4 py-2"
      />
      <span className="text-sm text-muted-foreground">IQD</span>
      <Button size="sm" onClick={() => onSave(item.id, parseFloat(price))}>
        {saveLabel}
      </Button>
    </div>
  );
}
