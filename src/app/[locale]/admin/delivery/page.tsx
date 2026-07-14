import { getTranslations } from "next-intl/server";
import { getOrders } from "@/server/actions/orders";
import { OrdersTable } from "@/components/features/orders/orders-table";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminDeliveryPage() {
  const t = await getTranslations("nav");
  const orders = await getOrders({ status: "ready_for_delivery" });

  return (
    <div className="stack-page">
      <PageHeader title={t("delivery")} />
      <OrdersTable orders={orders} basePath="/admin/orders" />
    </div>
  );
}
