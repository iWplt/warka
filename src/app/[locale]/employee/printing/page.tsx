import { getTranslations } from "next-intl/server";
import { getKanbanPrintingOrders } from "@/server/actions/products";
import { PrintingKanban } from "@/components/features/employee/printing-kanban";
import { PageHeader } from "@/components/ui/page-header";

export default async function EmployeePrintingPage() {
  const t = await getTranslations("nav");
  const columns = await getKanbanPrintingOrders();

  return (
    <div className="space-y-6">
      <PageHeader title={t("printing")} />
      <PrintingKanban columns={columns} />
    </div>
  );
}
