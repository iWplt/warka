"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LivePreview, getPreviewDataUrl } from "@/components/features/design/live-preview";
import { uploadDesignPreview } from "@/server/actions/design";
import type { DesignSubmission, DesignTemplate, Order, OrderItem } from "@/types/database";
import type { TemplateConfig } from "@/types/database";

type DesignUploadPanelProps = {
  order: Order;
  design: DesignSubmission;
  designTemplate?: DesignTemplate | null;
  items: OrderItem[];
};

export function DesignUploadPanel({
  order,
  design,
  designTemplate,
  items,
}: DesignUploadPanelProps) {
  const t = useTranslations("design");
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);

  const canUpload = ["designing", "needs_modification", "pending_review"].includes(order.status);
  if (!canUpload) return null;

  const templateConfig = designTemplate?.template_config as TemplateConfig | undefined;
  const values = (design.customizations ?? {}) as Record<string, string>;
  const firstItem = items[0];

  const handleUpload = async () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    const dataUrl = getPreviewDataUrl(canvas ?? null);
    if (!dataUrl) {
      toast.error(t("uploadFailed"));
      return;
    }

    setUploading(true);
    try {
      await uploadDesignPreview(order.id, design.id, dataUrl);
      toast.success(t("uploadSuccess"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-glass-border bg-white/5 p-4">
      <p className="text-sm text-muted-foreground">{t("uploadHint")}</p>
      {templateConfig ? (
        <div ref={canvasRef}>
          <LivePreview
            templateImageUrl={designTemplate?.preview_url ?? undefined}
            config={templateConfig}
            values={values}
            fontFamily={firstItem?.font_family ?? undefined}
            logoUrl={firstItem?.logo_url ?? undefined}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noTemplate")}</p>
      )}
      <Button type="button" variant="accent" disabled={uploading} onClick={handleUpload}>
        <Upload className="me-2 size-4" aria-hidden />
        {uploading ? t("uploading") : t("uploadPreview")}
      </Button>
    </div>
  );
}
