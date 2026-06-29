import { getTranslations } from "next-intl/server";
import { getUsersByRole } from "@/server/actions/users";
import { UsersManagement } from "@/components/features/admin/users-management";
import { isLocalAuthEnabled } from "@/lib/auth/local-session";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const t = await getTranslations("nav");
  const [students, representatives] = await Promise.all([
    getUsersByRole("student"),
    getUsersByRole("representative"),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={t("users")} />
      <UsersManagement
        students={students}
        representatives={representatives}
        localOnly={isLocalAuthEnabled()}
      />
    </div>
  );
}
