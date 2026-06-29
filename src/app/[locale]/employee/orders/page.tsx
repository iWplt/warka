import { getTranslations } from "next-intl/server";
import { getPrintingQueueOrders } from "@/server/actions/orders";
import { OrdersTable } from "@/components/features/orders/orders-table";
import { PageHeader } from "@/components/ui/page-header";

export default async function EmployeeOrdersPage() {
  const t = await getTranslations("nav");
  const orders = await getPrintingQueueOrders();

  return (
    <div className="space-y-8">
      <PageHeader title={t("orders")} />
      <OrdersTable orders={orders} basePath="/employee/orders" />
    </div>
  );
}
