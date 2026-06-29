import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function RepresentativeNewBatchPage() {
  const t = await getTranslations("repDashboard");

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-glass-border glass p-10 text-center">
      <h1 className="text-h2 font-bold">{t("batchCreationTitle")}</h1>
      <p className="mt-4 text-muted-foreground">{t("batchCreationHint")}</p>
      <Link
        href="/representative/batches"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        {t("backToBatches")}
      </Link>
    </div>
  );
}
