"use client";

import { useEffect, useMemo } from "react";
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
import {
  DEFAULT_PAYMENT_METHOD_SETTINGS,
  paymentMethodHasDetails,
  type PaymentMethodConfig,
  type PaymentMethodSettings,
} from "@/lib/payment/payment-method-settings";
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
  /** Admin-configured methods; inactive ones are hidden. */
  methodSettings?: PaymentMethodSettings;
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

function DetailRows({
  config,
  isAr,
}: {
  config: PaymentMethodConfig;
  isAr: boolean;
}) {
  if (!paymentMethodHasDetails(config)) return null;

  const rows: { label: string; value: string }[] = [];
  if (config.phone) {
    rows.push({ label: isAr ? "رقم الهاتف" : "Phone", value: config.phone });
  }
  if (config.account_number) {
    rows.push({
      label: isAr ? "رقم الحساب" : "Account number",
      value: config.account_number,
    });
  }
  if (config.card_number) {
    rows.push({
      label: isAr ? "رقم البطاقة" : "Card number",
      value: config.card_number,
    });
  }

  return (
    <div className="rounded-xl border border-warka-border bg-card/80 p-3 space-y-2">
      <p className="text-xs font-semibold text-warka-text">
        {isAr ? "بيانات التحويل" : "Transfer details"}
      </p>
      {rows.map((row) => (
        <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-xs text-warka-text-muted">{row.label}</span>
          <span
            dir="ltr"
            className="font-mono text-sm font-semibold tracking-wide text-warka-text"
          >
            {row.value}
          </span>
        </div>
      ))}
      {config.notes ? (
        <p className="border-t border-warka-border/60 pt-2 text-xs leading-relaxed text-warka-text-secondary">
          {config.notes}
        </p>
      ) : null}
    </div>
  );
}

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
  methodSettings = DEFAULT_PAYMENT_METHOD_SETTINGS,
}: PaymentMethodsStepProps) {
  const isAr = locale === "ar";
  const needsReceipt = selectedMethod !== "cash";

  const activeMethods = useMemo(() => {
    const active = methodSettings.methods.filter((m) => m.is_active);
    return active.length > 0
      ? active
      : IRAQI_PAYMENT_METHODS.map(
          (id) =>
            methodSettings.methods.find((m) => m.id === id) ?? {
              id,
              is_active: true,
              phone: "",
              account_number: "",
              card_number: "",
              notes: "",
            }
        );
  }, [methodSettings]);

  const selectedConfig =
    activeMethods.find((m) => m.id === selectedMethod) ?? activeMethods[0];

  useEffect(() => {
    if (!activeMethods.some((m) => m.id === selectedMethod) && activeMethods[0]) {
      onSelect(activeMethods[0].id);
    }
  }, [activeMethods, selectedMethod, onSelect]);

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

      <div className="grid gap-2.5">
        {activeMethods.map((method) => {
          const selected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(method.id)}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-2xl border-2 p-3 text-start transition-all touch-manipulation sm:p-3.5",
                selected
                  ? "border-warka-primary bg-warka-primary/5 shadow-sm"
                  : "border-warka-border bg-card hover:border-warka-primary/40",
                disabled && "opacity-50"
              )}
            >
              <PaymentMethodLogo method={method.id} size="lg" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-bold leading-snug text-warka-text">
                  {iraqiPaymentLabel(method.id, isAr)}
                </p>
                <p className="text-xs leading-relaxed text-warka-text-muted">
                  {isAr ? METHOD_HINT[method.id].ar : METHOD_HINT[method.id].en}
                </p>
              </div>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  selected
                    ? "border-warka-primary bg-warka-primary"
                    : "border-warka-border bg-card"
                )}
                aria-hidden
              >
                {selected && <span className="size-1.5 rounded-full bg-white" />}
              </span>
            </button>
          );
        })}
      </div>

      {selectedConfig ? <DetailRows config={selectedConfig} isAr={isAr} /> : null}

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
