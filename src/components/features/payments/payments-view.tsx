"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { recordPayment } from "@/server/actions/payments";
import { PaymentsSummary } from "@/components/features/payments/payments-summary";
import { formatIqd } from "@/lib/format/currency";
import type { PaymentMethod } from "@/types/database";
import { useState } from "react";

type PaymentsViewProps = {
  payments: Array<{
    id: string;
    amount: number;
    method: PaymentMethod;
    payment_status: string;
    created_at: string;
    orders?: { order_number: string; total: number } | null;
  }>;
  unpaidOrders: Array<{
    id: string;
    order_number: string;
    total: number;
    payments?: { amount: number }[];
  }>;
};

export function PaymentsView({ payments, unpaidOrders }: PaymentsViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [submitting, setSubmitting] = useState(false);

  const summary = useMemo(() => {
    const totalRevenue = payments.reduce((sum, row) => sum + Number(row.amount), 0);
    const unpaidTotal = unpaidOrders.reduce((sum, order) => {
      const paid = (order.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
      return sum + Math.max(Number(order.total) - paid, 0);
    }, 0);
    const partialCount = unpaidOrders.filter((order) => {
      const paid = (order.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
      return paid > 0 && paid < Number(order.total);
    }).length;

    return { totalRevenue, unpaidTotal, partialCount };
  }, [payments, unpaidOrders]);

  const handleRecord = async () => {
    if (!selectedOrder || !amount) return;
    setSubmitting(true);
    try {
      await recordPayment({
        order_id: selectedOrder,
        amount: Number.parseFloat(amount),
        method,
      });
      toast.success(t("common.success"));
      setSelectedOrder("");
      setAmount("");
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PaymentsSummary {...summary} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">{t("payments.recordPayment")}</h2>
          {unpaidOrders.length === 0 ? (
            <EmptyState
              title={t("payments.noUnpaidOrders")}
              description={t("payments.noUnpaidOrdersHint")}
            />
          ) : (
          <div className="space-y-4">
            <Select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
            >
              <option value="">{t("payments.selectOrder")}</option>
              {unpaidOrders.map((order) => {
                const paid = (order.payments ?? []).reduce(
                  (sum, row) => sum + Number(row.amount),
                  0
                );
                const remaining = Number(order.total) - paid;
                return (
                  <option key={order.id} value={order.id}>
                    {order.order_number} — {formatIqd(remaining, locale)}
                  </option>
                );
              })}
            </Select>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("payments.amount")}
            />
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              <option value="cash">{t("paymentMethod.cash")}</option>
              <option value="bank_transfer">{t("paymentMethod.bank_transfer")}</option>
              <option value="zain_cash">{t("paymentMethod.zain_cash")}</option>
            </Select>
            <Button
              onClick={handleRecord}
              variant="accent"
              disabled={submitting || !selectedOrder || !amount}
            >
              {t("common.save")}
            </Button>
          </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">{t("payments.recentPayments")}</h2>
          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title={t("payments.noPayments")}
              description={t("payments.noPaymentsHint")}
            />
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {payments.slice(0, 20).map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg bg-secondary/40 p-3 text-sm"
                >
                  <span>{payment.orders?.order_number ?? "—"}</span>
                  <span className="tabular-nums">
                    {formatIqd(Number(payment.amount), locale)} —{" "}
                    {t(`paymentMethod.${payment.method}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
