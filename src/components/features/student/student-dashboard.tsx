import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ClipboardList, CreditCard, Package, Sparkles } from "lucide-react";
import { getStudentDashboardData } from "@/server/actions/dashboard";
import { OrderStatusBadge } from "@/components/shared";
import { formatIqd } from "@/lib/format/currency";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export async function StudentDashboard() {
  const t = await getTranslations("studentDashboard");
  const statusT = await getTranslations("orderStatus");
  const locale = await getLocale();
  const data = await getStudentDashboardData();

  if (!data) {
    return <EmptyState title={t("noData")} />;
  }

  const cards = [
    { label: t("totalOrders"), value: data.stats.totalOrders, icon: Package },
    { label: t("activeOrders"), value: data.stats.activeOrders, icon: ClipboardList },
    { label: t("awaitingApproval"), value: data.stats.awaitingApproval, icon: Sparkles },
    {
      label: t("balanceDue"),
      value: formatIqd(data.stats.balanceDue, locale),
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("welcome")}
        description={t("subtitle")}
        actions={
          <Button asChild>
            <Link href="/student/orders/new">{t("newOrder")}</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                  <p className="text-xl font-semibold tabular-nums tracking-tight">{card.value}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.activeOrder && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground">{t("activeOrder")}</p>
              <p className="text-lg font-semibold">{data.activeOrder.order_number}</p>
              <OrderStatusBadge
                status={data.activeOrder.status}
                label={statusT(data.activeOrder.status)}
              />
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/student/tracking?orderId=${data.activeOrder.id}`}>
                  {t("trackOrder")}
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/student/orders/${data.activeOrder.id}`}>{t("viewOrder")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h3">{t("recentOrders")}</h2>
          <Link href="/student/orders" className="text-sm text-primary hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <EmptyState title={t("noOrders")} />
        ) : (
          <div className="space-y-2">
            {data.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/student/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{order.order_number}</p>
                  <OrderStatusBadge status={order.status} label={statusT(order.status)} />
                </div>
                <p className="text-sm tabular-nums">{formatIqd(order.total, locale)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
