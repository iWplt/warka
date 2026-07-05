"use client";

import { CreditCard, Truck } from "lucide-react";
import { toast } from "sonner";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { AsiaHawalaMock } from "@/components/payment/asia-hawala-mock";
import { SuperQiMock } from "@/components/payment/super-qi-mock";
import { ZainCashMock } from "@/components/payment/zain-cash-mock";
import { COD_FEE_IQD } from "@/lib/constants/iraq-market";
import { formatIqd } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export type PaymentMethodId = "cod" | "super_qi" | "zain_cash" | "asia_hawala" | "card";

export type PaymentMethodsStepProps = {
  locale: "ar" | "en";
  selectedMethod: PaymentMethodId;
  onSelect: (method: PaymentMethodId) => void;
  onPaid?: (method: PaymentMethodId) => void;
  total: number;
  className?: string;
  disabled?: boolean;
};

export function PaymentMethodsStep({
  locale,
  selectedMethod,
  onSelect,
  onPaid,
  total,
  className,
  disabled,
}: PaymentMethodsStepProps) {
  const isAr = locale === "ar";

  const handleOnlinePaid = (method: PaymentMethodId) => {
    onPaid?.(method);
  };

  const handleCodConfirm = () => {
    toast.success(
      isAr ? "تم اختيار الدفع عند الاستلام" : "Cash on delivery selected",
      {
        description: isAr
          ? `رسوم التوصيل: ${formatIqd(COD_FEE_IQD, locale)}`
          : `Delivery fee: ${formatIqd(COD_FEE_IQD, locale)}`,
      }
    );
    onPaid?.("cod");
  };

  return (
    <WarkaCard className={cn("space-y-4", className)}>
      <WarkaCardTitle>
        {isAr ? "طريقة الدفع" : "Payment method"}
      </WarkaCardTitle>

      <div
        className={cn(
          "rounded-2xl border-2 bg-card p-4 transition-all",
          selectedMethod === "cod"
            ? "border-warka-primary shadow-card"
            : "border-warka-border hover:border-warka-primary/40"
        )}
      >
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="radio"
            name="payment-method"
            checked={selectedMethod === "cod"}
            onChange={() => onSelect("cod")}
            disabled={disabled}
            className="mt-1 size-4 accent-warka-primary"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-warka-primary/10 text-warka-primary">
                <Truck className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-warka-text">
                  {isAr ? "الدفع عند الاستلام" : "Cash on delivery"}
                </p>
                <p className="text-xs text-warka-text-muted">
                  {isAr ? "الخيار الافتراضي" : "Default option"}
                </p>
              </div>
            </div>

            {selectedMethod === "cod" && (
              <div className="mt-4 space-y-2 border-t border-warka-border pt-4">
                <p className="text-sm text-warka-text-secondary">
                  {isAr
                    ? `رسوم التوصيل عند الاستلام: ${formatIqd(COD_FEE_IQD, locale)}`
                    : `COD delivery fee: ${formatIqd(COD_FEE_IQD, locale)}`}
                </p>
                <p className="text-sm font-bold text-warka-primary">
                  {isAr ? "الإجمالي:" : "Total:"} {formatIqd(total + COD_FEE_IQD, locale)}
                </p>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleCodConfirm}
                  className="mt-2 w-full rounded-lg bg-warka-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark disabled:opacity-50"
                >
                  {isAr ? "تأكيد الدفع عند الاستلام" : "Confirm COD"}
                </button>
              </div>
            )}
          </div>
        </label>
      </div>

      <SuperQiMock
        selected={selectedMethod === "super_qi"}
        onSelect={() => onSelect("super_qi")}
        locale={locale}
        amount={total}
        disabled={disabled}
        onPaid={() => handleOnlinePaid("super_qi")}
      />

      <ZainCashMock
        selected={selectedMethod === "zain_cash"}
        onSelect={() => onSelect("zain_cash")}
        locale={locale}
        amount={total}
        disabled={disabled}
        onPaid={() => handleOnlinePaid("zain_cash")}
      />

      <AsiaHawalaMock
        selected={selectedMethod === "asia_hawala"}
        onSelect={() => onSelect("asia_hawala")}
        locale={locale}
        amount={total}
        disabled={disabled}
        onPaid={() => handleOnlinePaid("asia_hawala")}
      />

      <div
        className={cn(
          "rounded-2xl border-2 border-dashed bg-warka-bg/50 p-4 transition-all",
          selectedMethod === "card"
            ? "border-warka-primary shadow-card"
            : "border-warka-border hover:border-warka-primary/40"
        )}
      >
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="radio"
            name="payment-method"
            checked={selectedMethod === "card"}
            onChange={() => onSelect("card")}
            disabled={disabled}
            className="mt-1 size-4 accent-warka-primary"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-warka-text/5 text-warka-text">
                <CreditCard className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-warka-text">
                  {isAr ? "بطاقة ائتمان" : "Credit / debit card"}
                </p>
                <p className="text-xs text-warka-text-muted">
                  {isAr ? "Stripe — قريباً" : "Stripe — coming soon"}
                </p>
              </div>
            </div>

            {selectedMethod === "card" && (
              <div className="mt-4 rounded-xl border border-warka-border bg-card p-4 text-center text-sm text-warka-text-muted">
                {isAr
                  ? "الدفع بالبطاقة سيتوفر قريباً عبر Stripe."
                  : "Card payments via Stripe will be available soon."}
              </div>
            )}
          </div>
        </label>
      </div>
    </WarkaCard>
  );
}
