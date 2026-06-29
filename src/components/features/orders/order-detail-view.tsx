"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/features/orders/order-timeline";
import { StudentOrderProgress } from "@/components/features/orders/student-order-progress";
import { StudentPaymentSummary } from "@/components/features/orders/student-payment-summary";
import { DesignApprovalPanel } from "@/components/features/design/design-approval-panel";
import { DesignUploadPanel } from "@/components/features/design/design-upload-panel";
import { ArchiveOrderButton } from "@/components/features/orders/archive-order-button";
import { LivePreview } from "@/components/features/design/live-preview";
import {
  updateOrderStatus,
  addOrderNote,
  cancelOrderByStudent,
} from "@/server/actions/orders";
import type {
  Order,
  OrderItem,
  OrderStatusHistory,
  DesignSubmission,
  Payment,
  DesignTemplate,
} from "@/types/database";
import type { TemplateConfig } from "@/types/database";
import { useState } from "react";

const STATUSES = [
  "pending_review", "designing", "awaiting_approval", "needs_modification",
  "ready_for_printing", "printing", "printed", "ready_for_delivery", "delivered", "cancelled",
] as const;

type OrderDetailData = {
  order: Order;
  items: OrderItem[];
  history: OrderStatusHistory[];
  design: DesignSubmission | null;
  payments: Payment[];
};

type OrderDetailViewProps = {
  data: OrderDetailData;
  canManage?: boolean;
  isStudentView?: boolean;
  designTemplate?: DesignTemplate | null;
};

export function OrderDetailView({
  data,
  canManage = false,
  isStudentView = false,
  designTemplate = null,
}: OrderDetailViewProps) {
  const t = useTranslations();
  const statusT = useTranslations("orderStatus");
  const productT = useTranslations("productType");
  const studentT = useTranslations("studentOrder");
  const router = useRouter();
  const [note, setNote] = useState("");
  const { order, items, history, design, payments } = data;

  const handleStatus = async (status: string) => {
    try {
      await updateOrderStatus(order.id, status as typeof STATUSES[number]);
      toast.success(t("common.success"));
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrderByStudent(order.id);
      toast.success(studentT("orderCancelled"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  const handleNote = async () => {
    if (!note.trim()) return;
    await addOrderNote(order.id, note);
    setNote("");
    toast.success(t("common.success"));
    router.refresh();
  };

  const canCancel =
    isStudentView &&
    ["new", "pending_review", "needs_modification", "awaiting_approval"].includes(order.status);

  const templateConfig = designTemplate?.template_config as TemplateConfig | undefined;
  const customizationValues = (design?.customizations ?? {}) as Record<string, string>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {isStudentView && (
          <section className="rounded-2xl border border-glass-border glass p-6">
            <h2 className="mb-4 font-semibold">{studentT("progressTitle")}</h2>
            <StudentOrderProgress status={order.status} />
          </section>
        )}

        {isStudentView && (
          <StudentPaymentSummary total={Number(order.total)} payments={payments} />
        )}

        {!isStudentView && (
          <div className="rounded-2xl glass p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("common.status")}</p>
                <p className="text-xl font-semibold">{statusT(order.status)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.total")}</p>
                <p className="text-xl font-semibold">
                  {Number(order.total).toLocaleString()} IQD
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl glass p-6">
          <h2 className="mb-4 font-semibold">{t("orders.itemsTitle")}</h2>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between rounded-lg bg-white/5 p-3 text-sm">
                <span>{productT(item.product_type)}</span>
                <span>{Number(item.unit_price).toLocaleString()} IQD</span>
              </li>
            ))}
          </ul>
        </div>

        {design && (
          <div className="rounded-2xl glass p-6">
            <h2 className="mb-4 font-semibold">{t("design.preview")}</h2>
            {design.preview_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={design.preview_url} alt="Design preview" className="max-w-md rounded-xl" />
            ) : templateConfig ? (
              <LivePreview
                templateImageUrl={designTemplate?.preview_url ?? undefined}
                config={templateConfig}
                values={customizationValues}
                fontFamily={items[0]?.font_family ?? undefined}
                logoUrl={items[0]?.logo_url ?? undefined}
              />
            ) : null}
            {design.modification_notes && (
              <p className="mt-4 rounded-lg bg-accent/10 p-3 text-sm">{design.modification_notes}</p>
            )}
            {isStudentView && <DesignApprovalPanel design={design} order={order} />}
            {canManage && (
              <DesignUploadPanel
                order={order}
                design={design}
                designTemplate={designTemplate}
                items={items}
              />
            )}
          </div>
        )}

        {canManage && (
          <div className="flex justify-end">
            <ArchiveOrderButton order={order} />
          </div>
        )}

        {canCancel && (
          <div className="rounded-2xl border border-destructive/20 glass p-6">
            <Button onClick={handleCancel} variant="outline" className="text-destructive">
              {studentT("cancelOrder")}
            </Button>
          </div>
        )}

        {canManage && (
          <div className="rounded-2xl glass p-6">
            <h2 className="mb-4 font-semibold">{t("orders.changeStatus")}</h2>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={order.status === s ? "default" : "outline"}
                  onClick={() => handleStatus(s)}
                >
                  {statusT(s)}
                </Button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("orders.addNote")}
                className="flex-1 rounded-xl border border-glass-border bg-white/5 px-4 py-2 text-sm"
              />
              <Button onClick={handleNote} variant="secondary">{t("common.save")}</Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="mb-4 font-semibold">{t("orders.timeline")}</h2>
        <OrderTimeline history={history} />
      </div>
    </div>
  );
}
