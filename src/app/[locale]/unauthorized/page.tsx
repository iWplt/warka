import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { BrandLockup } from "@/components/brand/brand-lockup";

export default async function UnauthorizedPage() {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-dvh-safe flex-col items-center justify-center gap-6 bg-warka-bg p-4 font-arabic">
      <BrandLockup layout="auth" />
      <h1 className="page-title text-center">{t("unauthorized")}</h1>
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-warka-primary px-6 py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark"
      >
        {t("login")}
      </Link>
    </div>
  );
}
