import { getTranslations } from "next-intl/server";
import { Package, Printer, Truck } from "lucide-react";
import { getEmployeeDashboardData } from "@/server/actions/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCards } from "@/components/features/dashboard/stats-cards";
import { RecentOrders } from "@/components/features/dashboard/recent-orders";

export default async function EmployeeDashboardPage() {
  const t = await getTranslations("nav");
  const tDash = await getTranslations("employeeDashboard");
  const data = await getEmployeeDashboardData();

  if (!data) {
    return (
      <div>
        <PageHeader title={t("dashboard")} />
        <p className="text-muted-foreground">{tDash("noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t("dashboard")} />
      <StatsCards
        items={[
          { label: tDash("readyToPrint"), value: data.readyCount, icon: Package, accent: "primary" },
          { label: tDash("printing"), value: data.printingCount, icon: Printer, accent: "accent" },
          {
            label: tDash("readyPickup"),
            value: data.readyDeliveryCount,
            icon: Truck,
            accent: "default",
          },
        ]}
      />
      <div>
        <h2 className="mb-4 text-lg font-semibold">{tDash("recentQueue")}</h2>
        <RecentOrders
          orders={data.recentOrders}
          basePath="/employee/orders"
          emptyLabel={tDash("noOrders")}
        />
      </div>
    </div>
  );
}
