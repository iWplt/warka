import { getTranslations } from "next-intl/server";
import { getPayments, getUnpaidOrders } from "@/server/actions/payments";
import { PaymentsView } from "@/components/features/payments/payments-view";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminPaymentsPage() {
  const t = await getTranslations("nav");
  const payments = await getPayments();
  const unpaidOrders = await getUnpaidOrders();

  return (
    <div className="stack-page">
      <PageHeader title={t("payments")} />
      <PaymentsView payments={payments} unpaidOrders={unpaidOrders} />
    </div>
  );
}
