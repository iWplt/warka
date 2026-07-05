import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Pencil } from "lucide-react";
import { getOrderById } from "@/server/actions/orders";
import { canEmbroideryEditOrder } from "@/lib/orders/state-machine";
import { OrderDetailView } from "@/components/features/orders/order-detail-view";
import { OrderDetailHeader } from "@/components/features/orders/order-detail-header";
import { env } from "@/lib/env";

export default async function EmbroideryOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("orders");
  const { id } = await params;
  const data = await getOrderById(id);
  if (!data) notFound();

  const canEdit = canEmbroideryEditOrder(data.order);

  return (
    <div>
      <OrderDetailHeader order={data.order} appUrl={env.NEXT_PUBLIC_APP_URL} />
      {canEdit && (
        <div className="mb-6 rounded-2xl border-2 border-warka-primary/30 bg-warka-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{t("embroideryEditTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("embroideryEditHint")}</p>
            </div>
            <Link
              href={`/embroidery/orders/${data.order.id}/edit`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-warka-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-warka-primary-dark"
            >
              <Pencil className="size-4" />
              {t("embroideryEditAction")}
            </Link>
          </div>
        </div>
      )}
      <OrderDetailView data={data} canManage={false} />
    </div>
  );
}
