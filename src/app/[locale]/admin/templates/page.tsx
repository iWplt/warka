import { getTranslations } from "next-intl/server";
import { getTemplates } from "@/server/actions/design";
import { TemplatesManager } from "@/components/features/design/templates-manager";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminTemplatesPage() {
  const t = await getTranslations("design");
  const templates = await getTemplates();

  return (
    <div className="space-y-8">
      <PageHeader title={t("templates")} />
      <TemplatesManager templates={templates} />
    </div>
  );
}
