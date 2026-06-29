import { getTranslations } from "next-intl/server";
import { getOrders } from "@/server/actions/orders";
import { OrdersTable } from "@/components/features/orders/orders-table";

export default async function RepresentativeOrdersPage() {
  const t = await getTranslations("orders");
  const orders = await getOrders();

  return (
    <div>
      <h1 className="text-h1 mb-8 font-bold">{t("title")}</h1>
      <OrdersTable orders={orders} basePath="/representative/orders" />
    </div>
  );
}
