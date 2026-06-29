import { getTranslations } from "next-intl/server";
import { getBatches } from "@/server/actions/batches";
import { Link } from "@/i18n/routing";

export default async function RepresentativeBatchesPage() {
  const t = await getTranslations("batches");
  const batches = await getBatches();

  return (
    <div>
      <h1 className="text-h1 mb-8 font-bold">{t("title")}</h1>
      {batches.length === 0 ? (
        <p className="rounded-2xl glass p-6 text-muted-foreground">{t("noBatches")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Link
              key={batch.id}
              href={`/representative/batches/${batch.id}`}
              className="rounded-2xl glass p-6 transition-all hover:scale-[1.02]"
            >
              <p className="font-semibold">{batch.name}</p>
              <p className="text-sm text-muted-foreground">{batch.status}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
