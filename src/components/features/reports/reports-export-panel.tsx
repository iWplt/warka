"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  exportOrdersExcel,
  exportOrdersPdf,
  exportSalesExcel,
  exportStudentsExcel,
} from "@/server/actions/reports";

const ORDER_STATUSES = [
  "new",
  "pending_review",
  "designing",
  "awaiting_approval",
  "needs_modification",
  "ready_for_printing",
  "printing",
  "printed",
  "ready_for_delivery",
  "delivered",
  "cancelled",
] as const;

export function ReportsExportPanel() {
  const t = useTranslations("reports");
  const statusT = useTranslations("orderStatus");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState<
    "excel" | "pdf" | "students" | "sales" | null
  >(null);

  const filters = {
    status: status || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
  };

  const download = (mime: string, base64: string, extension: string) => {
    const link = document.createElement("a");
    link.href = `data:${mime};base64,${base64}`;
    link.download = `orders-${Date.now()}.${extension}`;
    link.click();
  };

  const handleExcel = async () => {
    setExporting("excel");
    try {
      const base64 = await exportOrdersExcel(filters);
      download(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        base64,
        "xlsx"
      );
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(null);
    }
  };

  const handlePdf = async () => {
    setExporting("pdf");
    try {
      const base64 = await exportOrdersPdf(filters);
      download("application/pdf", base64, "pdf");
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(null);
    }
  };

  const handleStudentsExcel = async () => {
    setExporting("students");
    try {
      const base64 = await exportStudentsExcel();
      download(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        base64,
        "xlsx"
      );
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(null);
    }
  };

  const handleSalesExcel = async () => {
    setExporting("sales");
    try {
      const base64 = await exportSalesExcel();
      download(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        base64,
        "xlsx"
      );
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-warka-border bg-card p-4 shadow-card sm:p-5">
      <h2 className="mb-4 font-semibold">{t("exportTab")}</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">{t("dateFrom")}</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">{t("dateTo")}</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">{t("statusFilter")}</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t("allStatuses")}</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusT(value)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleExcel} variant="accent" disabled={exporting !== null}>
          {t("exportExcel")}
        </Button>
        <Button onClick={handlePdf} variant="outline" disabled={exporting !== null}>
          {t("exportPdf")}
        </Button>
        <Button onClick={handleStudentsExcel} variant="outline" disabled={exporting !== null}>
          {t("exportStudents")}
        </Button>
        <Button onClick={handleSalesExcel} variant="outline" disabled={exporting !== null}>
          {t("exportSales")}
        </Button>
      </div>
    </div>
  );
}
