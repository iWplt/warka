import { getTranslations } from "next-intl/server";
import { getBatches } from "@/server/actions/batches";
import { getUsersByRole } from "@/server/actions/users";
import { AdminBatchesManager } from "@/components/features/batches/admin-batches-manager";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AdminBatchesPage() {
  const t = await getTranslations("batches");
  const batches = await getBatches();
  const representatives = await getUsersByRole("representative");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} />
      <AdminBatchesManager batches={batches} representatives={representatives} />
    </div>
  );
}
