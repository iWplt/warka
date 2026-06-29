import { getTranslations } from "next-intl/server";
import { getPriceCatalog } from "@/server/actions/payments";
import { SettingsView } from "@/components/features/admin/settings-view";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminSettingsPage() {
  const t = await getTranslations("nav");
  const prices = await getPriceCatalog();

  return (
    <div className="space-y-8">
      <PageHeader title={t("settings")} />
      <SettingsView prices={prices} />
    </div>
  );
}
