import { getTranslations, getLocale } from "next-intl/server";
import { QrCodeDisplay } from "@/components/shared";
import { OrderStatusBadge } from "@/components/shared";
import { InvoiceDownloadButton } from "@/components/features/orders/invoice-download-button";
import { formatIqd } from "@/lib/format/currency";
import type { Order } from "@/types/database";

type OrderDetailHeaderProps = {
  order: Order;
  appUrl: string;
  qrPath?: string;
  showInvoice?: boolean;
};

export async function OrderDetailHeader({
  order,
  appUrl,
  qrPath,
  showInvoice = false,
}: OrderDetailHeaderProps) {
  const t = await getTranslations("orders");
  const statusT = await getTranslations("orderStatus");
  const locale = await getLocale();
  const qrValue = `${appUrl}${qrPath ?? `/admin/orders/${order.id}`}`;

  return (
    <div className="mb-6 grid gap-6 rounded-2xl border border-glass-border glass p-6 lg:grid-cols-[1fr_auto]">
      <div>
        <p className="text-sm text-muted-foreground">{t("orderNumber")}</p>
        <h1 className="text-h1 font-bold">{order.order_number}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={order.status} label={statusT(order.status)} />
          {order.student_modified_at && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
              {locale === "ar" ? "معدّل من الطالب" : "Edited by student"}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleString(locale)}
          </span>
          {showInvoice && (
            <InvoiceDownloadButton
              orderId={order.id}
              orderNumber={order.order_number}
            />
          )}
        </div>
        <p className="mt-4 text-lg font-semibold text-accent">
          {formatIqd(Number(order.total), locale)}
        </p>
      </div>
      <QrCodeDisplay value={qrValue} label={order.order_number} />
    </div>
  );
}
