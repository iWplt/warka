import { getTranslations } from "next-intl/server";
import { getPriceCatalog } from "@/server/actions/payments";
import { getDepositSettings } from "@/server/actions/settings";
import {
  getMessageTemplates,
  getMessagingSettingsForAdmin,
  getRecentNotificationLogs,
  getWhatsAppProviderStatus,
} from "@/server/actions/message-templates";
import { SettingsView } from "@/components/features/admin/settings-view";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminSettingsPage() {
  const t = await getTranslations("nav");
  const [
    prices,
    depositSettings,
    messagingSettings,
    messageTemplates,
    notificationLogs,
    whatsappStatus,
  ] = await Promise.all([
    getPriceCatalog(),
    getDepositSettings(),
    getMessagingSettingsForAdmin(),
    getMessageTemplates(),
    getRecentNotificationLogs(),
    getWhatsAppProviderStatus(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={t("settings")} />
      <SettingsView
        prices={prices}
        depositSettings={depositSettings}
        messagingSettings={messagingSettings}
        messageTemplates={messageTemplates}
        notificationLogs={notificationLogs}
        whatsappConfigured={whatsappStatus.configured}
        whatsappProvider={whatsappStatus.provider}
      />
    </div>
  );
}
