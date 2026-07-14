import { getTranslations } from "next-intl/server";
import { listAllFonts } from "@/server/actions/fonts";
import { FontsManager } from "@/components/features/admin/fonts-manager";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminFontsPage() {
  const t = await getTranslations("nav");
  const fonts = await listAllFonts();

  return (
    <div className="stack-page">
      <PageHeader title={t("fonts")} />
      <FontsManager fonts={fonts} />
    </div>
  );
}
