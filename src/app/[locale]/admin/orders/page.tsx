import { getTranslations } from "next-intl/server";
import { getOrders } from "@/server/actions/orders";
import { AdminOrdersManager } from "@/components/features/orders/admin-orders-manager";
import { PageHeader } from "@/components/ui/page-header";

type PageProps = {
  searchParams: Promise<{ archived?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const t = await getTranslations("orders");
  const { archived } = await searchParams;
  const showArchived = archived === "true";
  const orders = await getOrders({ archived: showArchived });

  return (
    <div className="stack-page">
      <PageHeader title={t("title")} />
      <AdminOrdersManager orders={orders} showArchived={showArchived} />
    </div>
  );
}
