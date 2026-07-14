"use client";

import { Upload } from "lucide-react";
import { toast } from "sonner";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { Button } from "@/components/ui/button";
import { PaymentMethodLogo } from "@/components/payment/payment-method-logos";
import {
  IRAQI_PAYMENT_METHODS,
  iraqiPaymentLabel,
  type IraqiPaymentMethodId,
} from "@/lib/payment/iraqi-methods";
import { formatIqd } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export type PaymentMethodId = IraqiPaymentMethodId;

export type PaymentMethodsStepProps = {
  locale: "ar" | "en";
  selectedMethod: PaymentMethodId;
  onSelect: (method: PaymentMethodId) => void;
  /** Called when student confirms method + receipt (cash may skip receipt). */
  onPaid?: (method: PaymentMethodId) => void;
  total: number;
  receiptDataUrl: string | null;
  onReceiptChange: (url: string | null) => void;
  className?: string;
  disabled?: boolean;
};

const METHOD_HINT: Record<IraqiPaymentMethodId, { ar: string; en: string }> = {
  zain_cash: {
    ar: "حوّل العربون عبر زين كاش ثم ارفع صورة الإيصال",
    en: "Send the deposit via Zain Cash, then upload the receipt",
  },
  super_qi: {
    ar: "ادفع عبر SuperQi ثم ارفع لقطة الشاشة",
    en: "Pay with SuperQi, then upload a screenshot",
  },
  fib: {
    ar: "حوّل عبر تطبيق FIB ثم ارفع إثبات التحويل",
    en: "Transfer via FIB app, then upload proof",
  },
  asiapay: {
    ar: "ادفع عبر آسيا بي / حوالة ثم ارفع الإيصال",
    en: "Pay via AsiaPay / hawala, then upload the receipt",
  },
  cash: {
    ar: "دفع نقدي عند الاستلام أو في المحل — يفضّل إرفاق صورة إن وُجدت",
    en: "Pay cash in person — optional receipt photo",
  },
};

export function PaymentMethodsStep({
  locale,
  selectedMethod,
  onSelect,
  onPaid,
  total,
  receiptDataUrl,
  onReceiptChange,
  className,
  disabled,
}: PaymentMethodsStepProps) {
  const isAr = locale === "ar";
  const needsReceipt = selectedMethod !== "cash";

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(isAr ? "ارفع صورة فقط" : "Upload an image only");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isAr ? "الحد الأقصى 5 ميجا" : "Max size 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onReceiptChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (needsReceipt && !receiptDataUrl) {
      toast.error(
        isAr ? "ارفع صورة إيصال الدفع أولاً" : "Upload a payment receipt first"
      );
      return;
    }
    toast.success(
      isAr
        ? "تم تسجيل طريقة الدفع — الطلب بانتظار موافقة الأدمن على العربون"
        : "Payment method saved — awaiting admin deposit approval"
    );
    onPaid?.(selectedMethod);
  };

  return (
    <WarkaCard className={cn("space-y-4", className)}>
      <div>
        <WarkaCardTitle>{isAr ? "طريقة دفع العربون" : "Deposit payment method"}</WarkaCardTitle>
        <p className="mt-1 text-sm text-warka-text-muted">
          {isAr
            ? "اختر الطريقة، أتمّ الدفع، ثم ارفع صورة الإيصال ليوافق الأدمن."
            : "Pick a method, pay, then upload the receipt for admin approval."}
        </p>
      </div>

      <div className="grid gap-3">
        {IRAQI_PAYMENT_METHODS.map((method) => {
          const selected = selectedMethod === method;
          return (
            <button
              key={method}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(method)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-start transition-all touch-manipulation",
                selected
                  ? "border-warka-primary bg-warka-primary/5 shadow-sm"
                  : "border-warka-border bg-card hover:border-warka-primary/40",
                disabled && "opacity-50"
              )}
            >
              <PaymentMethodLogo method={method} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug text-warka-text">
                  {iraqiPaymentLabel(method, isAr)}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-warka-text-muted">
                  {isAr ? METHOD_HINT[method].ar : METHOD_HINT[method].en}
                </p>
              </div>
              <span
                className={cn(
                  "size-4 shrink-0 rounded-full border-2",
                  selected
                    ? "border-warka-primary bg-warka-primary"
                    : "border-warka-border bg-card"
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-warka-primary/20 bg-warka-primary/5 p-4">
        <p className="text-xs text-warka-text-muted">{isAr ? "مبلغ العربون" : "Deposit amount"}</p>
        <p className="text-xl font-bold text-warka-primary">{formatIqd(total, locale)}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-warka-text">
          {isAr
            ? needsReceipt
              ? "صورة إيصال الدفع *"
              : "صورة إثبات (اختياري)"
            : needsReceipt
              ? "Payment receipt photo *"
              : "Proof photo (optional)"}
        </p>
        {receiptDataUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-warka-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptDataUrl} alt="" className="max-h-48 w-full object-contain bg-media-bg" />
            <button
              type="button"
              className="absolute end-2 top-2 rounded-lg bg-card/95 px-2 py-1 text-xs font-medium text-destructive"
              onClick={() => onReceiptChange(null)}
              disabled={disabled}
            >
              {isAr ? "حذف" : "Remove"}
            </button>
          </div>
        ) : (
          <label
            className={cn(
              "flex min-h-[7rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-warka-border bg-warka-bg/40 px-4 py-6 text-center transition-colors hover:border-warka-primary/40",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <Upload className="size-6 text-warka-primary" />
            <span className="text-sm font-medium text-warka-text">
              {isAr ? "اضغط لرفع صورة الإيصال" : "Tap to upload receipt"}
            </span>
            <span className="text-xs text-warka-text-muted">PNG / JPG — max 5MB</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={disabled}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full min-h-11"
        disabled={disabled || (needsReceipt && !receiptDataUrl)}
        onClick={handleConfirm}
      >
        {isAr ? "تأكيد وإرسال للعربون للمراجعة" : "Confirm — send deposit for review"}
      </Button>
    </WarkaCard>
  );
}
