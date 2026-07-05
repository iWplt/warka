import { notFound } from "next/navigation";
import { getOrderById } from "@/server/actions/orders";
import { getProductionPhotosForOrder } from "@/server/actions/production-photos";
import { getTemplates } from "@/server/actions/design";
import { OrderDetailView } from "@/components/features/orders/order-detail-view";
import { OrderDetailUxExtras } from "@/components/features/orders/order-detail-ux-extras";
import { OrderDetailHeader } from "@/components/features/orders/order-detail-header";
import { env } from "@/lib/env";

export default async function StudentOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <OrderDetailHeader
        order={data.order}
        appUrl={env.NEXT_PUBLIC_APP_URL}
        qrPath={`/student/orders/${data.order.id}`}
        showInvoice
      />
      <div className="px-4 sm:px-6">
        <OrderDetailUxExtras
          orderNumber={data.order.order_number}
          status={data.order.status}
        />
      </div>
      <OrderDetailView
        data={data}
        isStudentView
        productionPhotos={productionPhotos}
        designTemplate={designTemplate}
      />
    </div>
  );
}
