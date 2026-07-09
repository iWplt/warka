import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { BrandLockup } from "@/components/brand/brand-lockup";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-warka-bg p-4 font-arabic">
      <BrandLockup layout="auth" className="opacity-60" />
      <h1 className="text-6xl font-extrabold text-warka-text">404</h1>
      <p className="text-warka-text-secondary">{t("noResults")}</p>
      <Link
        href="/"
        className="rounded-xl bg-warka-primary px-6 py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark"
      >
        {t("home")}
      </Link>
    </div>
  );
}
