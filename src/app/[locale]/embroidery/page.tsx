import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getEmbroideryQueueOrders } from "@/server/actions/orders";
import { OrdersTable } from "@/components/features/orders/orders-table";
import { PageHeader } from "@/components/ui/page-header";
import { Sparkles } from "lucide-react";

export default async function EmbroideryDashboardPage() {
  const t = await getTranslations("nav");
  const orders = await getEmbroideryQueueOrders();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("embroideryPortal")}
        description={
          t("embroideryPortalHint")
        }
      />
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-primary">
          <Sparkles className="size-4" />
          {t("embroideryWorkflowTitle")}
        </p>
        <p className="mt-1 text-muted-foreground">{t("embroideryWorkflowHint")}</p>
      </div>
      <OrdersTable orders={orders} basePath="/embroidery/orders" />
      <Link
        href="/embroidery/orders"
        className="text-sm font-semibold text-primary hover:underline"
      >
        {t("orders")} →
      </Link>
    </div>
  );
}
