import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getOrderById } from "@/server/actions/orders";
import { getProductionPhotosForOrder } from "@/server/actions/production-photos";
import { OrderDetailView } from "@/components/features/orders/order-detail-view";
import { OrderDetailHeader } from "@/components/features/orders/order-detail-header";
import { env } from "@/lib/env";
import { PRINTING_PIPELINE_STATUSES } from "@/lib/orders/status-flow";

export default async function EmployeeOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("orders");
  const { id } = await params;
  const data = await getOrderById(id);
  if (!data) notFound();

  if (!PRINTING_PIPELINE_STATUSES.includes(data.order.status)) {
    notFound();
  }

  const productionPhotos = await getProductionPhotosForOrder(id);

  return (
    <div>
      <OrderDetailHeader order={data.order} appUrl={env.NEXT_PUBLIC_APP_URL} />
      <p className="mb-4 text-sm text-muted-foreground">{t("employeeReadOnly")}</p>
      <OrderDetailView
        data={data}
        canManage={false}
        canUploadProductionPhotos
        productionPhotos={productionPhotos}
      />
    </div>
  );
}
