import { getTranslations } from "next-intl/server";
import { getOrders } from "@/server/actions/orders";
import { OrdersTable } from "@/components/features/orders/orders-table";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminPrintingPage() {
  const t = await getTranslations("nav");
  const orders = await getOrders({ status: "ready_for_printing" });
  const printing = await getOrders({ status: "printing" });
  const all = [...orders, ...printing];

  return (
    <div className="stack-page">
      <PageHeader title={t("printing")} />
      <OrdersTable orders={all} basePath="/admin/orders" />
    </div>
  );
}
