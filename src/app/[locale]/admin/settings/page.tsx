import { getTranslations } from "next-intl/server";
import { getPriceCatalog } from "@/server/actions/payments";
import { getDepositSettings } from "@/server/actions/settings";
import { SettingsView } from "@/components/features/admin/settings-view";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminSettingsPage() {
  const t = await getTranslations("nav");
  const [prices, depositSettings] = await Promise.all([
    getPriceCatalog(),
    getDepositSettings(),
  ]);

  return (
    <div className="stack-page">
      <PageHeader title={t("settings")} />
      <SettingsView prices={prices} depositSettings={depositSettings} />
    </div>
  );
}
