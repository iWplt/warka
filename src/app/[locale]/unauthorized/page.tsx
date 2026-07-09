import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { WARKA_MARK_PATH } from "@/lib/constants/brand";

export default async function UnauthorizedPage() {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-warka-bg p-4 font-arabic">
      <Image
        src={WARKA_MARK_PATH}
        alt="WARKA"
        width={72}
        height={72}
        className="h-16 w-16 object-contain"
      />
      <h1 className="text-2xl font-bold text-warka-text">{t("unauthorized")}</h1>
      <Link
        href="/login"
        className="rounded-xl bg-warka-primary px-6 py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark"
      >
        {t("login")}
      </Link>
    </div>
  );
}
