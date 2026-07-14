import { getTranslations } from "next-intl/server";
import { getOrdersByStatus, getActivityLog } from "@/server/actions/reports";
import { ReportsView } from "@/components/features/reports/reports-view";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminReportsPage() {
  const t = await getTranslations("reports");
  const byStatus = await getOrdersByStatus();
  const activity = await getActivityLog(30);

  return (
    <div className="stack-page">
      <PageHeader title={t("title")} />
      <ReportsView byStatus={byStatus} activity={activity} />
    </div>
  );
}
