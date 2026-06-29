import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { WARKA_LOGO_PATH } from "@/lib/constants/brand";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-warka-bg p-4 font-arabic">
      <Image src={WARKA_LOGO_PATH} alt="WARKA" width={64} height={64} className="h-16 w-16 opacity-60" />
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
