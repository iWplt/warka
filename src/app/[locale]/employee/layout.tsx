import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layouts/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function EmployeeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "employee") {
    redirect(`/${locale}/unauthorized`);
  }

  const canPrint = await hasPermission(profile.id, "printing:view");
  if (!canPrint) {
    redirect(`/${locale}/unauthorized`);
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
