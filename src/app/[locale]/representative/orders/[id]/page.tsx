import { notFound } from "next/navigation";
import { getOrderById } from "@/server/actions/orders";
import { OrderDetailView } from "@/components/features/orders/order-detail-view";
import { OrderDetailHeader } from "@/components/features/orders/order-detail-header";
import { env } from "@/lib/env";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RepresentativeOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getOrderById(id);

  if (!data) notFound();

  return (
    <div>
      <OrderDetailHeader order={data.order} appUrl={env.NEXT_PUBLIC_APP_URL} />
      <OrderDetailView data={data} />
    </div>
  );
}
