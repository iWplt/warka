"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  downloadBatchImportTemplate,
  importStudentsFromExcel,
} from "@/server/actions/batches";
import { validateExcelFile } from "@/lib/upload/validate";

type ExcelImportPanelProps = {
  batchId: string;
  onImported: () => void;
};

export function ExcelImportPanel({ batchId, onImported }: ExcelImportPanelProps) {
  const t = useTranslations("batches");
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    imported: number;
    skipped: number;
    accountsCreated: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);

  const fileToBase64 = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const handleDownloadTemplate = async () => {
    try {
      const base64 = await downloadBatchImportTemplate();
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
      link.download = "batch-students-template.xlsx";
      link.click();
    } catch {
      toast.error(t("error"));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateExcelFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setImporting(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await importStudentsFromExcel(batchId, base64);
      setLastResult(result);
      if (result.imported > 0) {
        toast.success(t("imported", { count: result.imported }));
        onImported();
      } else {
        toast.error(t("importNone"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-glass-border glass p-5">
      <h3 className="mb-3 font-semibold">{t("excelImportTitle")}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{t("excelImportHint")}</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={handleDownloadTemplate}>
          <Download className="me-2 size-4" aria-hidden />
          {t("downloadTemplate")}
        </Button>
        <Button
          type="button"
          variant="accent"
          disabled={importing}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="me-2 size-4" aria-hidden />
          {importing ? t("loading") : t("uploadExcel")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
      {lastResult && (
        <div className="mt-4 rounded-xl bg-foreground/5 p-4 text-sm">
          <p>{t("importSummary", { imported: lastResult.imported, skipped: lastResult.skipped })}</p>
          {lastResult.accountsCreated > 0 && (
            <p className="mt-1 text-primary">
              {t("accountsCreatedOnImport", { count: lastResult.accountsCreated })}
            </p>
          )}
          {lastResult.errors.length > 0 && (
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-muted-foreground">
              {lastResult.errors.slice(0, 8).map((error) => (
                <li key={`${error.row}-${error.message}`}>
                  {t("importRowError", { row: error.row, message: error.message })}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
