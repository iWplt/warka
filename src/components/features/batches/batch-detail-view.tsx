"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  addBatchStudent,
  removeBatchStudent,
  confirmBatch,
  createBatchStudentAccount,
} from "@/server/actions/batches";
import { ExcelImportPanel } from "@/components/features/batches/excel-import-panel";
import type { Batch, BatchStudent } from "@/types/database";

type BatchDetailViewProps = {
  batch: Batch;
  students: BatchStudent[];
  allowCreateAccounts?: boolean;
};

export function BatchDetailView({
  batch,
  students,
  allowCreateAccounts = false,
}: BatchDetailViewProps) {
  const t = useTranslations("batches");
  const authT = useTranslations("auth");
  const paymentT = useTranslations("paymentStatus");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = async () => {
    try {
      await confirmBatch(batch.id);
      toast.success(t("batchConfirmed"));
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold">{batch.name}</h1>
          <p className="text-muted-foreground">
            {batch.college} — {batch.department} — {batch.graduation_year}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setShowAdd(!showAdd)} variant="outline">
            {t("addStudent")}
          </Button>
          <Button type="button" onClick={() => setShowImport(!showImport)} variant="outline">
            {t("uploadExcel")}
          </Button>
          <Button type="button" onClick={handleConfirm} variant="secondary">
            {t("confirmed")}
          </Button>
          {allowCreateAccounts && (
            <Button asChild variant="accent">
              <Link href={`/representative/batches/${batch.id}/group-order`}>
                {t("groupOrder")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {allowCreateAccounts && (
        <p className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          {t("createAccountHint")}
        </p>
      )}

      {showImport && (
        <ExcelImportPanel
          batchId={batch.id}
          onImported={() => startTransition(() => router.refresh())}
        />
      )}

      {showAdd && (
        <AddStudentForm
          batchId={batch.id}
          onSuccess={() => {
            setShowAdd(false);
            startTransition(() => router.refresh());
          }}
        />
      )}

      {isPending && (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      )}

      <StudentsTable
        batch={batch}
        students={students}
        allowCreateAccounts={allowCreateAccounts}
        creatingFor={creatingFor}
        setCreatingFor={setCreatingFor}
        onRefresh={() => startTransition(() => router.refresh())}
        t={t}
        authT={authT}
        paymentT={paymentT}
      />
    </div>
  );
}

type StudentsTableProps = {
  batch: Batch;
  students: BatchStudent[];
  allowCreateAccounts: boolean;
  creatingFor: string | null;
  setCreatingFor: (id: string | null) => void;
  onRefresh: () => void;
  t: ReturnType<typeof useTranslations>;
  authT: ReturnType<typeof useTranslations>;
  paymentT: ReturnType<typeof useTranslations>;
};

function StudentsTable({
  batch,
  students,
  allowCreateAccounts,
  creatingFor,
  setCreatingFor,
  onRefresh,
  t,
  authT,
  paymentT,
}: StudentsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl glass">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-glass-border bg-white/5">
            <th className="px-4 py-3 text-start">{t("studentName")}</th>
            <th className="px-4 py-3 text-start">{authT("phone")}</th>
            <th className="px-4 py-3 text-start">{t("size")}</th>
            <th className="px-4 py-3 text-start">{t("payment")}</th>
            {allowCreateAccounts && (
              <th className="px-4 py-3 text-start">{t("account")}</th>
            )}
            <th className="px-4 py-3 text-start">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b border-glass-border">
              <td className="px-4 py-3">{student.full_name}</td>
              <td className="px-4 py-3">{student.phone ?? "—"}</td>
              <td className="px-4 py-3">{student.size ?? "—"}</td>
              <td className="px-4 py-3">{paymentT(student.payment_status)}</td>
              {allowCreateAccounts && (
                <td className="px-4 py-3">
                  {student.student_id ? (
                    <span className="rounded-full bg-primary/15 px-2 py-1 text-xs text-primary">
                      {t("hasAccount")}
                    </span>
                  ) : creatingFor === student.id ? (
                    <CreateAccountForm
                      batchStudentId={student.id}
                      onCancel={() => setCreatingFor(null)}
                      onSuccess={() => {
                        setCreatingFor(null);
                        onRefresh();
                      }}
                    />
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCreatingFor(student.id)}
                    >
                      {t("createAccount")}
                    </Button>
                  )}
                </td>
              )}
              <td className="px-4 py-3">
                {!student.confirmed && !student.student_id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await removeBatchStudent(student.id, batch.id);
                        onRefresh();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : t("error"));
                      }
                    }}
                  >
                    {t("remove")}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddStudentForm({
  batchId,
  onSuccess,
}: {
  batchId: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("batches");
  const inputClass = "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2 text-sm";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await addBatchStudent({
        batch_id: batchId,
        full_name: form.get("full_name") as string,
        phone: (form.get("phone") as string) || undefined,
        size: (form.get("size") as string) || undefined,
        sash_color: (form.get("sash_color") as string) || undefined,
        cap_type: (form.get("cap_type") as string) || undefined,
        custom_text: (form.get("custom_text") as string) || undefined,
      });
      toast.success(t("studentAdded"));
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl glass p-4 sm:grid-cols-3">
      <input name="full_name" placeholder={t("studentName")} required className={inputClass} />
      <input name="phone" placeholder="Phone" className={inputClass} />
      <input name="size" placeholder={t("size")} className={inputClass} />
      <input name="sash_color" placeholder="Sash color" className={inputClass} />
      <input name="cap_type" placeholder="Cap type" className={inputClass} />
      <input name="custom_text" placeholder="Custom text" className={inputClass} />
      <Button type="submit" variant="accent" className="sm:col-span-3">
        {t("addStudent")}
      </Button>
    </form>
  );
}

function CreateAccountForm({
  batchStudentId,
  onCancel,
  onSuccess,
}: {
  batchStudentId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("batches");
  const authT = useTranslations("auth");
  const [loading, setLoading] = useState(false);
  const inputClass = "w-full rounded-lg border border-glass-border bg-background px-3 py-2 text-sm";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createBatchStudentAccount({
        batch_student_id: batchStudentId,
        email: form.get("email") as string,
        password: form.get("password") as string,
      });
      toast.success(t("accountCreated"));
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-w-[240px] flex-col gap-2">
      <input
        name="email"
        type="email"
        required
        placeholder={authT("email")}
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        required
        minLength={6}
        placeholder={authT("password")}
        className={inputClass}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="accent" disabled={loading}>
          {t("createAccount")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
