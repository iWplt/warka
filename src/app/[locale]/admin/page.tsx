import { getTranslations } from "next-intl/server";
import { getAdminDashboardData } from "@/server/actions/dashboard";
import { AdminDashboardView } from "@/components/features/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminDashboardPage() {
  const t = await getTranslations("dashboard");
  const data = await getAdminDashboardData();

  if (!data) {
    return (
      <EmptyState
        title={t("noData")}
        className="rounded-lg border border-dashed"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t("welcome")} description={t("overview")} />
      <AdminDashboardView data={data} />
    </div>
  );
}
