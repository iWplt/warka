import { getTranslations } from "next-intl/server";
import { getOrders } from "@/server/actions/orders";
import { OrdersTable } from "@/components/features/orders/orders-table";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminDesignPage() {
  const t = await getTranslations("design");
  const navT = await getTranslations("nav");

  const [designing, needsModification] = await Promise.all([
    getOrders({ status: "designing" }),
    getOrders({ status: "needs_modification" }),
  ]);

  return (
    <div className="stack-page">
      <PageHeader title={navT("design")} description={t("queueHint")} />

      <section className="space-y-4">
        <h2 className="text-h3">{t("designingQueue")}</h2>
        {designing.length === 0 ? (
          <EmptyState title={t("emptyQueue")} />
        ) : (
          <OrdersTable orders={designing} basePath="/admin/orders" />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-h3">{t("modificationQueue")}</h2>
        {needsModification.length === 0 ? (
          <EmptyState title={t("emptyModificationQueue")} />
        ) : (
          <OrdersTable orders={needsModification} basePath="/admin/orders" />
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        {t("openOrderHint")}{" "}
        <Link href="/admin/templates" className="text-primary hover:underline">
          {t("templates")}
        </Link>
      </p>
    </div>
  );
}
