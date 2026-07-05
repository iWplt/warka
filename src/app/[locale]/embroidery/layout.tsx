import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layouts/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function EmbroideryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getCurrentProfile();

  if (!profile || (profile.role !== "embroidery" && profile.role !== "admin")) {
    redirect(`/${locale}/unauthorized`);
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
