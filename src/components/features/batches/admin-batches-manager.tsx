"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { createBatch } from "@/server/actions/batches";
import type { Batch, Profile } from "@/types/database";

type AdminBatchesManagerProps = {
  batches: Batch[];
  representatives: Profile[];
  /** Route prefix for list/detail links, e.g. /admin/batches or /employee/batches */
  basePath?: string;
};

export function AdminBatchesManager({
  batches,
  representatives,
  basePath = "/admin/batches",
}: AdminBatchesManagerProps) {
  const t = useTranslations("batches");
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const batch = await createBatch({
        name: form.get("name") as string,
        college: (form.get("college") as string) || undefined,
        department: (form.get("department") as string) || undefined,
        graduation_year: form.get("graduation_year")
          ? Number(form.get("graduation_year"))
          : undefined,
        notes: (form.get("notes") as string) || undefined,
        representative_id: form.get("representative_id") as string,
      });
      toast.success(t("batchCreated"));
      setShowForm(false);
      startTransition(() => {
        router.push(`${basePath}/${batch.id}`);
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    }
  };

  const inputClass =
    "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2 text-sm";

  return (
    <div className="space-y-6">
      <Button type="button" variant="accent" onClick={() => setShowForm(!showForm)}>
        {t("createBatch")}
      </Button>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-4 rounded-2xl glass p-6 sm:grid-cols-2">
          <input name="name" placeholder={t("batchName")} required className={inputClass} />
          <Select name="representative_id" required defaultValue="">
            <option value="" disabled>
              {t("selectRepresentative")}
            </option>
            {representatives.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.full_name}
              </option>
            ))}
          </Select>
          <input name="college" placeholder={t("college")} className={inputClass} />
          <input name="department" placeholder={t("department")} className={inputClass} />
          <input
            name="graduation_year"
            type="number"
            placeholder={t("graduationYear")}
            className={inputClass}
          />
          <textarea
            name="notes"
            placeholder={t("notes")}
            className={`${inputClass} sm:col-span-2`}
            rows={2}
          />
          <Button type="submit" variant="accent" className="sm:col-span-2">
            {t("createBatch")}
          </Button>
        </form>
      )}

      {isPending && (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      )}

      <div className="space-y-2">
        {batches.map((batch) => (
          <Link
            key={batch.id}
            href={`${basePath}/${batch.id}`}
            className="flex items-center justify-between rounded-2xl glass p-4 transition hover:bg-white/5"
          >
            <div>
              <p className="font-medium">{batch.name}</p>
              <p className="text-sm text-muted-foreground">
                {batch.college} — {batch.department} — {batch.graduation_year}
              </p>
            </div>
            <span className="text-sm text-muted-foreground">{batch.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
