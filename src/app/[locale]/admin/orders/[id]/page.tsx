import { notFound } from "next/navigation";
import { getOrderById } from "@/server/actions/orders";
import { getProductionPhotosForOrder } from "@/server/actions/production-photos";
import { getTemplates } from "@/server/actions/design";
import { OrderDetailView } from "@/components/features/orders/order-detail-view";
import { OrderDetailHeader } from "@/components/features/orders/order-detail-header";
import { env } from "@/lib/env";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getOrderById(id);

  if (!data) notFound();

  const productionPhotos = await getProductionPhotosForOrder(id);

  let designTemplate = null;
  if (data.design?.template_id) {
    const templates = await getTemplates();
    designTemplate = templates.find((tpl) => tpl.id === data.design?.template_id) ?? null;
  }

  return (
    <div>
      <OrderDetailHeader order={data.order} appUrl={env.NEXT_PUBLIC_APP_URL} showInvoice />
      <OrderDetailView
        data={data}
        canManage
        canUploadProductionPhotos
        productionPhotos={productionPhotos}
        designTemplate={designTemplate}
      />
    </div>
  );
}
