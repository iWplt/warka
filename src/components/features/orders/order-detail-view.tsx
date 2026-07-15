"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/features/orders/order-timeline";
import { StudentOrderProgress } from "@/components/features/orders/student-order-progress";
import { StudentPaymentSummary } from "@/components/features/orders/student-payment-summary";
import { ProductionPhotosPanel } from "@/components/features/orders/production-photos-panel";
import type { ProductionPhotoView } from "@/server/actions/production-photos";
import { DesignApprovalPanel } from "@/components/features/design/design-approval-panel";
import { DesignUploadPanel } from "@/components/features/design/design-upload-panel";
import { ArchiveOrderButton } from "@/components/features/orders/archive-order-button";
import { OrderCustomerSummary } from "@/components/features/orders/order-customer-summary";
import { OrderItemsDetailPanel } from "@/components/features/orders/order-items-detail-panel";
import { OrderStudentEditLog } from "@/components/features/orders/order-student-edit-log";
import { LivePreview } from "@/components/features/design/live-preview";
import { Lock, Pencil, CheckCircle2, Banknote } from "lucide-react";
import { Link } from "@/i18n/routing";
import {
  canStudentEditOrder,
  isOrderConfirmed,
  orderLockMessage,
} from "@/lib/orders/state-machine";
import {
  addOrderNote,
  cancelOrderByStudent,
  unlockOrderForAdmin,
} from "@/server/actions/orders";
import { approveOrderDeposit } from "@/server/actions/payments";
import { OrderStatusSelect } from "@/components/features/orders/order-status-select";
import type { OrderItemMedia } from "@/lib/orders/order-item-details";
import type { OrderDetailStudent } from "@/lib/orders/parse-order-notes";
import type { TemplateConfig } from "@/types/database";
import type {
  Order,
  OrderItem,
  OrderStatusHistory,
  DesignSubmission,
  Payment,
  DesignTemplate,
} from "@/types/database";
import { useState } from "react";
import { useLocale } from "next-intl";

type EditLogEntry = {
  id: string;
  action: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  profiles?: { full_name: string } | null;
};

type OrderDetailData = {
  order: Order;
  items: OrderItem[];
  history: OrderStatusHistory[];
  design: DesignSubmission | null;
  payments: Payment[];
  student?: OrderDetailStudent | null;
  itemMedia?: Record<string, OrderItemMedia>;
  editLogs?: EditLogEntry[];
};

type OrderDetailViewProps = {
  data: OrderDetailData;
  canManage?: boolean;
  isStudentView?: boolean;
  designTemplate?: DesignTemplate | null;
  productionPhotos?: ProductionPhotoView[];
  canUploadProductionPhotos?: boolean;
};

export function OrderDetailView({
  data,
  canManage = false,
  isStudentView = false,
  designTemplate = null,
  productionPhotos = [],
  canUploadProductionPhotos = false,
}: OrderDetailViewProps) {
  const t = useTranslations();
  const locale = useLocale() as "ar" | "en";
  const statusT = useTranslations("orderStatus");
  const studentT = useTranslations("studentOrder");
  const router = useRouter();
  const [note, setNote] = useState("");
  const { order, items, history, design, payments, student = null, itemMedia = {}, editLogs = [] } = data;

  const handleCancel = async () => {
    try {
      await cancelOrderByStudent(order.id);
      toast.success(studentT("orderCancelled"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  const handleUnlock = async () => {
    try {
      await unlockOrderForAdmin(order.id);
      toast.success(t("common.success"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  const handleApproveDeposit = async () => {
    try {
      await approveOrderDeposit(order.id);
      toast.success(
        locale === "ar" ? "تمت الموافقة على العربون" : "Deposit approved"
      );
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
    canStudentEditOrder(order) &&
    ["new", "pending_review", "needs_modification", "awaiting_approval"].includes(order.status);

  const orderLocked = isStudentView && isOrderConfirmed(order);

  const templateConfig = designTemplate?.template_config as TemplateConfig | undefined;
  const customizationValues = (design?.customizations ?? {}) as Record<string, string>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {isStudentView && (
          <p className="text-sm text-muted-foreground">
            {locale === "ar"
              ? "تفاصيل طلبك الكاملة — راجع كل المنتجات والتطريز قبل التعديل."
              : "Your full order details — review products and embroidery before editing."}
          </p>
        )}

        {orderLocked && (
          <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm">
            <Lock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <p>{orderLockMessage(locale)}</p>
          </div>
        )}

        {isStudentView && productionPhotos.length > 0 && (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm">
            <p className="font-semibold text-primary">
              {locale === "ar" ? "تم الانتهاء من منتجك!" : "Your product is ready!"}
            </p>
            <p className="mt-1 text-muted-foreground">
              {locale === "ar"
                ? "شاهد صور المنتج الفعلي أدناه قبل الاستلام."
                : "View your finished product photos below before pickup."}
            </p>
          </div>
        )}

        {canManage && !order.deposit_paid_at && Number(order.deposit_required) > 0 && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-warka-text">
                  <Banknote className="size-5 text-amber-700" />
                  {locale === "ar" ? "عربون بانتظار الموافقة" : "Deposit awaiting approval"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale === "ar"
                    ? `المطلوب: ${Number(order.deposit_required).toLocaleString()} د.ع — راجع المدفوعات والإيصال ثم وافق.`
                    : `Required: ${Number(order.deposit_required).toLocaleString()} IQD — review payment/receipt then approve.`}
                </p>
                {payments.some((p) => p.notes?.includes("receipt:")) && (
                  <p className="mt-2 text-xs text-warka-text-muted" dir="ltr">
                    {payments.find((p) => p.notes?.includes("Deposit"))?.notes}
                  </p>
                )}
              </div>
              <Button type="button" onClick={() => void handleApproveDeposit()}>
                {locale === "ar" ? "الموافقة على العربون" : "Approve deposit"}
              </Button>
            </div>
          </div>
        )}

        {(productionPhotos.length > 0 || canUploadProductionPhotos) && (
          <ProductionPhotosPanel
            orderId={order.id}
            photos={productionPhotos}
            canUpload={canUploadProductionPhotos}
            canDelete={canManage}
          />
        )}

        <OrderCustomerSummary
          order={order}
          student={student}
          showShopNotes={canManage}
        />

        <OrderItemsDetailPanel order={order} items={items} itemMedia={itemMedia} />

        {isStudentView && (
          <StudentPaymentSummary total={Number(order.total)} payments={payments} />
        )}

        {isStudentView && canStudentEditOrder(order) && (
          <div className="rounded-2xl border-2 border-warka-primary/30 bg-warka-primary/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-warka-text">
                  <CheckCircle2 className="size-5 text-warka-primary" />
                  {locale === "ar" ? "راضٍ عن التفاصيل؟" : "Happy with the details?"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "عدّل الزخرفة والخطوط والتطريز — الإعدادات المقفولة من الممثل أو الإدارة تبقى كما هي."
                    : "Edit decoration, fonts, and embroidery — batch-locked settings stay unchanged."}
                </p>
              </div>
              <Link
                href={`/student/orders/${order.id}/edit`}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-warka-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-warka-primary-dark"
              >
                <Pencil className="size-4" />
                {locale === "ar" ? "تعديل الطلب" : "Edit order"}
              </Link>
            </div>
          </div>
        )}

        {isStudentView && (
          <section className="rounded-2xl border border-glass-border glass p-6">
            <h2 className="mb-4 font-semibold">{studentT("progressTitle")}</h2>
            <StudentOrderProgress status={order.status} />
          </section>
        )}

        {!isStudentView && (
          <div className="rounded-2xl glass p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-[12rem] flex-1">
                <p className="mb-1.5 text-sm text-muted-foreground">{t("common.status")}</p>
                {canManage ? (
                  <OrderStatusSelect orderId={order.id} value={order.status} />
                ) : (
                  <p className="text-xl font-semibold">{statusT(order.status)}</p>
                )}
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

        {canManage && editLogs.length > 0 && <OrderStudentEditLog entries={editLogs} />}

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

        {canManage && order.is_locked && (
          <div className="rounded-2xl border border-accent/30 glass p-6">
            <p className="mb-3 text-sm text-muted-foreground">
              {locale === "ar" ? "الطلب مقفل بعد دفع العربون" : "Order locked after deposit payment"}
            </p>
            <Button onClick={handleUnlock} variant="secondary" size="sm">
              {locale === "ar" ? "فتح الطلب للتعديل" : "Unlock for student edits"}
            </Button>
          </div>
        )}

        {canManage && (
          <div className="rounded-2xl glass p-6">
            <h2 className="mb-4 font-semibold">{t("orders.changeStatus")}</h2>
            <OrderStatusSelect
              orderId={order.id}
              value={order.status}
              className="max-w-md"
            />
            <div className="mt-4 flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("orders.addNote")}
                className="flex-1 rounded-xl border border-glass-border bg-foreground/5 px-4 py-2 text-sm"
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
