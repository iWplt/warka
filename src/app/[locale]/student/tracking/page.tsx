import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getOrderById } from "@/server/actions/orders";
import { getStudentDashboardData } from "@/server/actions/dashboard";
import { OrderDetailHeader } from "@/components/features/orders/order-detail-header";
import { OrderDetailView } from "@/components/features/orders/order-detail-view";
import { getTemplates } from "@/server/actions/design";
import { env } from "@/lib/env";

type PageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function StudentTrackingPage({ searchParams }: PageProps) {
  const t = await getTranslations("studentOrder");
  const { orderId } = await searchParams;
  const dashboard = await getStudentDashboardData();

  const targetOrderId = orderId ?? dashboard?.activeOrder?.id;
  if (!targetOrderId) {
    return (
      <div className="rounded-2xl border border-dashed border-glass-border glass p-12 text-center">
        <p className="text-muted-foreground">{t("noActiveOrder")}</p>
        <Link href="/student/orders/new" className="mt-4 inline-block text-primary hover:underline">
          {t("createFirstOrder")}
        </Link>
      </div>
    );
  }

  const data = await getOrderById(targetOrderId);
  if (!data) notFound();

  let designTemplate = null;
  if (data.design?.template_id) {
    const templates = await getTemplates();
    designTemplate = templates.find((tpl) => tpl.id === data.design?.template_id) ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">{t("trackingTitle")}</h1>
        <p className="text-muted-foreground">{t("trackingSubtitle")}</p>
      </div>
      <OrderDetailHeader
        order={data.order}
        appUrl={env.NEXT_PUBLIC_APP_URL}
        qrPath={`/student/orders/${data.order.id}`}
      />
      <OrderDetailView
        data={data}
        isStudentView
        designTemplate={designTemplate}
      />
    </div>
  );
}
