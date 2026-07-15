import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile, getRedirectForRole } from "@/lib/auth/guards";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function NotificationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getCurrentProfile();
  const t = await getTranslations("common");

  if (!profile) {
    redirect(`/${locale}/login?redirect=/${locale}/notifications`);
  }

  const dashboardPath = getRedirectForRole(profile.role);

  return (
    <div className="min-h-dvh-safe bg-warka-bg text-warka-text">
      <header className="border-b border-warka-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Link
            href={dashboardPath}
            className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-warka-text-secondary transition-colors hover:bg-warka-bg hover:text-warka-text"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("back")}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
