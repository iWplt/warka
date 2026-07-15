import { getTranslations } from "next-intl/server";
import {
  getMessageTemplates,
  getMessagingSettingsForAdmin,
  getRecentNotificationLogs,
  getWhatsAppProviderStatus,
} from "@/server/actions/message-templates";
import {
  MessageTemplatesPanel,
  MessagingSettingsPanel,
  NotificationLogPanel,
} from "@/components/features/admin/messaging-settings-panel";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminWhatsAppMessagesPage() {
  const t = await getTranslations("adminWhatsapp");
  const [messagingSettings, messageTemplates, notificationLogs, whatsappStatus] =
    await Promise.all([
      getMessagingSettingsForAdmin(),
      getMessageTemplates(),
      getRecentNotificationLogs(),
      getWhatsAppProviderStatus(),
    ]);

  return (
    <div className="stack-page">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="stack-section">
        <section className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="section-title mb-4">{t("settingsTitle")}</h2>
          <MessagingSettingsPanel
            settings={messagingSettings}
            providerConfigured={whatsappStatus.configured}
            providerName={whatsappStatus.provider}
          />
        </section>

        <section className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="section-title mb-1">{t("templatesTitle")}</h2>
          <p className="page-description mb-4">{t("templatesHint")}</p>
          <MessageTemplatesPanel templates={messageTemplates} />
        </section>

        <section className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="section-title mb-4">{t("logTitle")}</h2>
          <NotificationLogPanel logs={notificationLogs} />
        </section>
      </div>
    </div>
  );
}
