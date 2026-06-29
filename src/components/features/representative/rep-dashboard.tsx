import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Users, ClipboardList, UserCheck, CreditCard, Package } from "lucide-react";
import { getBatches, getRepresentativeDashboardStats } from "@/server/actions/batches";
import type { RepresentativeDashboardStats } from "@/server/actions/batches";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export async function RepDashboard() {
  const t = await getTranslations("repDashboard");
  const stats = await getRepresentativeDashboardStats();
  const batches = await getBatches();

  if (!stats) {
    return <EmptyState title={t("noData")} />;
  }

  const cards = buildCards(stats, t);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("welcome")}
        description={t("subtitle")}
        actions={
          <Button asChild>
            <Link href="/representative/batches">{t("manageBatches")}</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                  <p className="text-2xl font-semibold tabular-nums tracking-tight">{card.value}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h3">{t("yourBatches")}</h2>
          <Link href="/representative/tracking" className="text-sm text-primary hover:underline">
            {t("viewTracking")}
          </Link>
        </div>
        {batches.length === 0 ? (
          <EmptyState title={t("noBatches")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {batches.map((batch) => (
              <Link key={batch.id} href={`/representative/batches/${batch.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/30">
                  <CardContent className="p-6">
                    <p className="font-semibold">{batch.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {batch.college}, {batch.department}, {batch.graduation_year}
                    </p>
                    <p className="mt-2 text-xs font-medium text-primary">{batch.status}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function buildCards(
  stats: RepresentativeDashboardStats,
  t: Awaited<ReturnType<typeof getTranslations>>
) {
  return [
    { label: t("batches"), value: stats.batchCount, icon: Package },
    { label: t("students"), value: stats.totalStudents, icon: Users },
    { label: t("confirmed"), value: stats.confirmedStudents, icon: ClipboardList },
    { label: t("accounts"), value: stats.accountsCreated, icon: UserCheck },
    { label: t("activeOrders"), value: stats.activeOrders, icon: CreditCard },
  ];
}
