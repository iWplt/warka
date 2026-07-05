import { getTranslations } from "next-intl/server";
import { getEmbroideryQueueOrders } from "@/server/actions/orders";
import { OrdersTable } from "@/components/features/orders/orders-table";
import { PageHeader } from "@/components/ui/page-header";

export default async function EmbroideryOrdersPage() {
  const t = await getTranslations("nav");
  const orders = await getEmbroideryQueueOrders();

  return (
    <div className="space-y-8">
      <PageHeader title={t("embroideryOrders")} />
      <OrdersTable orders={orders} basePath="/embroidery/orders" />
    </div>
  );
}
