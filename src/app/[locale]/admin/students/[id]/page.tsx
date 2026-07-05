import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStudentAdminDashboard } from "@/server/actions/student-admin";
import { StudentAdminView } from "@/components/features/admin/student-admin-view";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

type AdminStudentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminStudentPage({ params }: AdminStudentPageProps) {
  const { id } = await params;
  const t = await getTranslations("studentAdmin");
  const data = await getStudentAdminDashboard(id);

  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={t("pageTitle")} description={t("pageSubtitle")} />
      <StudentAdminView data={data} />
    </div>
  );
}
