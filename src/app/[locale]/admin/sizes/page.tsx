import { getTranslations } from "next-intl/server";
import { getSizePolicies, listAllSizeGuideEntries } from "@/server/actions/settings";
import { SizesAdminView } from "@/components/features/admin/sizes-admin-view";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminSizesPage() {
  const t = await getTranslations("adminSizes");
  const [sizeGuideEntries, sizePolicies] = await Promise.all([
    listAllSizeGuideEntries(),
    getSizePolicies(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <SizesAdminView sizeGuideEntries={sizeGuideEntries} sizePolicies={sizePolicies} />
    </div>
  );
}
