"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Download, KeyRound, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExcelImportPanel } from "@/components/features/batches/excel-import-panel";
import { BatchSettingsPanel } from "@/components/features/batches/batch-settings-panel";
import { BatchSizePoliciesPanel } from "@/components/features/batches/batch-size-policies-panel";
import {
  addBatchStudent,
  removeBatchStudent,
  confirmBatch,
  createBatchStudentAccount,
  updateBatchStudent,
  regenerateBatchStudentCredentials,
  exportBatchCredentialsExcel,
  bulkCreateBatchAccounts,
} from "@/server/actions/batches";
import type { Batch, BatchStudent } from "@/types/database";

type BatchDetailViewProps = {
  batch: Batch;
  students: BatchStudent[];
  allowCreateAccounts?: boolean;
  isAdmin?: boolean;
};

export function BatchDetailView({
  batch,
  students,
  allowCreateAccounts = false,
  isAdmin = false,
}: BatchDetailViewProps) {
  const t = useTranslations("batches");
  const authT = useTranslations("auth");
  const paymentT = useTranslations("paymentStatus");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingStudent, setEditingStudent] = useState<BatchStudent | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);

  const handleConfirm = async () => {
    try {
      await confirmBatch(batch.id);
      toast.success(t("batchConfirmed"));
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    }
  };

  const handleExportCredentials = async () => {
    setExporting(true);
    try {
      const base64 = await exportBatchCredentialsExcel(batch.id);
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
      link.download = `batch-${batch.name}-credentials.xlsx`;
      link.click();
      toast.success(t("credentialsExported"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setExporting(false);
    }
  };

  const handleBulkAccounts = async () => {
    try {
      const { created } = await bulkCreateBatchAccounts(batch.id);
      toast.success(t("bulkAccountsCreated", { count: created }));
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    }
  };

  const accountsCount = students.filter((s) => s.student_id).length;
  const missingAccounts = students.length - accountsCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold">{batch.name}</h1>
          <p className="text-muted-foreground">
            {batch.college} — {batch.department} — {batch.graduation_year}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("rosterStats", {
              total: students.length,
              accounts: accountsCount,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setShowAdd(!showAdd)} variant="outline">
            {t("addStudent")}
          </Button>
          <Button type="button" onClick={() => setShowImport(!showImport)} variant="outline">
            {t("uploadExcel")}
          </Button>
          {accountsCount > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={exporting}
              onClick={handleExportCredentials}
              className="gap-2"
            >
              <Download className="size-4" aria-hidden />
              {exporting ? t("loading") : t("exportCredentials")}
            </Button>
          )}
          {allowCreateAccounts && missingAccounts > 0 && (
            <Button type="button" variant="secondary" onClick={handleBulkAccounts} className="gap-2">
              <KeyRound className="size-4" aria-hidden />
              {t("bulkCreateAccounts", { count: missingAccounts })}
            </Button>
          )}
          <Button type="button" onClick={handleConfirm} variant="secondary">
            {t("confirmed")}
          </Button>
          {allowCreateAccounts && (
            <Button asChild variant="accent">
              <Link
                href={
                  isAdmin
                    ? `/admin/batches/${batch.id}/group-order`
                    : `/representative/batches/${batch.id}/group-order`
                }
              >
                {t("groupOrder")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <BatchSettingsPanel batch={batch} isAdmin={isAdmin} />
      <BatchSizePoliciesPanel batch={batch} isAdmin={isAdmin} />

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
          withAccount={allowCreateAccounts}
          onSuccess={() => {
            setShowAdd(false);
            startTransition(() => router.refresh());
          }}
        />
      )}

      {editingStudent && (
        <EditStudentForm
          batchId={batch.id}
          student={editingStudent}
          isAdmin={isAdmin}
          onCancel={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            startTransition(() => router.refresh());
          }}
        />
      )}

      {isPending && <p className="text-sm text-muted-foreground">{t("loading")}</p>}

      <div className="overflow-x-auto rounded-2xl glass">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-glass-border bg-foreground/5">
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
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span>{student.full_name}</span>
                    {student.student_id && isAdmin && (
                      <Link
                        href={`/admin/students/${student.student_id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {t("viewStudentProfile")}
                      </Link>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{student.phone ?? "—"}</td>
                <td className="px-4 py-3">{student.size ?? "—"}</td>
                <td className="px-4 py-3">{paymentT(student.payment_status)}</td>
                {allowCreateAccounts && (
                  <td className="px-4 py-3">
                    {student.student_id ? (
                      <span className="rounded-full bg-primary/15 px-2 py-1 text-xs text-primary">
                        {t("hasAccount")}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await createBatchStudentAccount({ batch_student_id: student.id });
                            toast.success(t("accountCreated"));
                            startTransition(() => router.refresh());
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : t("error"));
                          }
                        }}
                      >
                        {t("createAccount")}
                      </Button>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingStudent(student)}
                      className="gap-1"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      {t("edit")}
                    </Button>
                    {student.student_id && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            const creds = await regenerateBatchStudentCredentials(student.id);
                            toast.success(
                              `${t("credentialsRegenerated")}: ${creds.accessCode}`
                            );
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : t("error"));
                          }
                        }}
                        className="gap-1"
                      >
                        <RefreshCw className="size-3.5" aria-hidden />
                        {t("regenerateCredentials")}
                      </Button>
                    )}
                    {!student.confirmed && !student.student_id && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await removeBatchStudent(student.id, batch.id);
                            startTransition(() => router.refresh());
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : t("error"));
                          }
                        }}
                      >
                        {t("remove")}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddStudentForm({
  batchId,
  withAccount,
  onSuccess,
}: {
  batchId: string;
  withAccount?: boolean;
  onSuccess: () => void;
}) {
  const t = useTranslations("batches");
  const inputClass = "w-full rounded-xl border border-glass-border bg-foreground/5 px-4 py-2 text-sm";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await addBatchStudent({
        batch_id: batchId,
        full_name: form.get("full_name") as string,
        phone: (form.get("phone") as string) || undefined,
        size: (form.get("size") as string) || undefined,
        custom_text: (form.get("custom_text") as string) || undefined,
        font_family: (form.get("font_family") as string) || undefined,
        height_cm: form.get("height_cm")
          ? Number(form.get("height_cm"))
          : undefined,
        weight_kg: form.get("weight_kg")
          ? Number(form.get("weight_kg"))
          : undefined,
        create_account: withAccount,
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
      <input name="height_cm" placeholder="Height (cm)" className={inputClass} />
      <input name="weight_kg" placeholder="Weight (kg)" className={inputClass} />
      <input name="custom_text" placeholder="Name on sash" className={inputClass} />
      <input name="font_family" placeholder="Font" className={inputClass} />
      <Button type="submit" variant="accent" className="sm:col-span-3">
        {withAccount ? t("addStudentWithAccount") : t("addStudent")}
      </Button>
    </form>
  );
}

function EditStudentForm({
  batchId,
  student,
  isAdmin,
  onCancel,
  onSuccess,
}: {
  batchId: string;
  student: BatchStudent;
  isAdmin: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("batches");
  const inputClass = "w-full rounded-xl border border-glass-border bg-foreground/5 px-4 py-2 text-sm";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await updateBatchStudent({
        batch_id: batchId,
        student_id: student.id,
        full_name: form.get("full_name") as string,
        phone: (form.get("phone") as string) || undefined,
        size: (form.get("size") as string) || undefined,
        custom_text: (form.get("custom_text") as string) || undefined,
        font_family: (form.get("font_family") as string) || undefined,
        height_cm: form.get("height_cm") ? Number(form.get("height_cm")) : undefined,
        weight_kg: form.get("weight_kg") ? Number(form.get("weight_kg")) : undefined,
        ...(isAdmin
          ? {
              sash_color: (form.get("sash_color") as string) || undefined,
              fabric_type: (form.get("fabric_type") as string) || undefined,
              cap_type: (form.get("cap_type") as string) || undefined,
            }
          : {}),
      });
      toast.success(t("studentUpdated"));
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-accent/30 glass p-4">
      <h3 className="mb-3 font-semibold">{t("editStudent")}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          name="full_name"
          defaultValue={student.full_name}
          placeholder={t("studentName")}
          required
          className={inputClass}
        />
        <input name="phone" defaultValue={student.phone ?? ""} placeholder="Phone" className={inputClass} />
        <input name="size" defaultValue={student.size ?? ""} placeholder={t("size")} className={inputClass} />
        <input
          name="height_cm"
          defaultValue={student.height_cm ?? ""}
          placeholder="Height (cm)"
          className={inputClass}
        />
        <input
          name="weight_kg"
          defaultValue={student.weight_kg ?? ""}
          placeholder="Weight (kg)"
          className={inputClass}
        />
        <input
          name="custom_text"
          defaultValue={student.custom_text ?? ""}
          placeholder="Name on sash"
          className={inputClass}
        />
        <input
          name="font_family"
          defaultValue={student.font_family ?? ""}
          placeholder="Font"
          className={inputClass}
        />
        {isAdmin && (
          <>
            <input
              name="sash_color"
              defaultValue={student.sash_color ?? ""}
              placeholder="Sash color"
              className={inputClass}
            />
            <input
              name="fabric_type"
              defaultValue={student.fabric_type ?? ""}
              placeholder="Fabric"
              className={inputClass}
            />
            <input
              name="cap_type"
              defaultValue={student.cap_type ?? ""}
              placeholder="Cap type"
              className={inputClass}
            />
          </>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit" variant="accent">
          {t("saveChanges")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
