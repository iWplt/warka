"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateDesignSubmission } from "@/server/actions/design";
import type { DesignSubmission, Order } from "@/types/database";

type DesignApprovalPanelProps = {
  design: DesignSubmission;
  order: Order;
};

export function DesignApprovalPanel({ design, order }: DesignApprovalPanelProps) {
  const t = useTranslations("studentOrder");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"approve" | "modify" | null>(null);
  const router = useRouter();

  const canAct =
    order.status === "awaiting_approval" &&
    design.preview_url &&
    design.status !== "approved";

  if (!canAct) return null;

  const handleApprove = async () => {
    setLoading("approve");
    try {
      await updateDesignSubmission(design.id, { status: "approved" });
      toast.success(t("designApproved"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(null);
    }
  };

  const handleModify = async () => {
    if (!notes.trim()) {
      toast.error(t("modificationNotesRequired"));
      return;
    }
    setLoading("modify");
    try {
      await updateDesignSubmission(design.id, {
        status: "needs_modification",
        modification_notes: notes,
      });
      toast.success(t("modificationRequested"));
      setNotes("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-glass-border bg-white/5 p-4">
      <p className="text-sm text-muted-foreground">{t("approvalHint")}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleApprove} variant="accent" disabled={loading !== null}>
          {t("approveDesign")}
        </Button>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t("modificationPlaceholder")}
        className="min-h-[80px] w-full rounded-xl border border-glass-border bg-background px-4 py-2 text-sm"
      />
      <Button
        onClick={handleModify}
        variant="outline"
        disabled={loading !== null}
      >
        {t("requestModification")}
      </Button>
    </div>
  );
}
