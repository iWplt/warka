"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportOrderInvoicePdf } from "@/server/actions/reports";

type InvoiceDownloadButtonProps = {
  orderId: string;
  orderNumber: string;
  variant?: "accent" | "outline" | "ghost";
};

export function InvoiceDownloadButton({
  orderId,
  orderNumber,
  variant = "outline",
}: InvoiceDownloadButtonProps) {
  const t = useTranslations("orders");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const base64 = await exportOrderInvoicePdf(orderId);
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = `invoice-${orderNumber}.pdf`;
      link.click();
      toast.success(t("invoiceDownloaded"));
    } catch {
      toast.error(t("invoiceFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={loading}
      onClick={handleDownload}
      className="gap-2"
    >
      <Download className="size-4" aria-hidden />
      {loading ? t("invoiceGenerating") : t("downloadInvoice")}
    </Button>
  );
}
