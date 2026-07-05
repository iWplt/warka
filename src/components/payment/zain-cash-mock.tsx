"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatIqd } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

type ZainCashPhase = "idle" | "redirecting" | "returned" | "success";

type ZainCashMockProps = {
  selected: boolean;
  onSelect: () => void;
  locale: "ar" | "en";
  amount: number;
  onPaid?: () => void;
  disabled?: boolean;
};

export function ZainCashMock({
  selected,
  onSelect,
  locale,
  amount,
  onPaid,
  disabled,
}: ZainCashMockProps) {
  const [phase, setPhase] = useState<ZainCashPhase>("idle");
  const isAr = locale === "ar";

  useEffect(() => {
    if (phase !== "redirecting") return;

    const redirectTimer = window.setTimeout(() => {
      setPhase("returned");
      toast.info(isAr ? "تمت العودة من زين كاش" : "Returned from Zain Cash", {
        id: "zain-cash-return",
      });
    }, 2000);

    const successTimer = window.setTimeout(() => {
      setPhase("success");
      toast.success(isAr ? "تم الدفع عبر زين كاش" : "Zain Cash payment successful", {
        id: "zain-cash-return",
      });
      onPaid?.();
    }, 3200);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearTimeout(successTimer);
    };
  }, [phase, isAr, onPaid]);

  const startRedirect = () => {
    if (phase !== "idle" || disabled) return;
    setPhase("redirecting");
    toast.loading(isAr ? "جاري التحويل إلى زين كاش..." : "Redirecting to Zain Cash...", {
      id: "zain-cash-redirect",
    });
  };

  const reset = () => setPhase("idle");

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-card p-4 transition-all",
        selected ? "border-[#25D366] shadow-card" : "border-warka-border hover:border-[#25D366]/40"
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="radio"
          name="payment-method"
          checked={selected}
          onChange={() => {
            onSelect();
            reset();
          }}
          disabled={disabled}
          className="mt-1 size-4 accent-[#25D366]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#25D366]/15 text-[#25D366]">
              <Wallet className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-warka-text">
                {isAr ? "زين كاش" : "Zain Cash"}
              </p>
              <p className="text-xs text-[#25D366]">
                {isAr ? "دفع آمن عبر التطبيق" : "Secure in-app payment"}
              </p>
            </div>
          </div>

          {selected && (
            <div className="mt-4 space-y-3 border-t border-warka-border pt-4">
              <p className="text-sm text-warka-text-secondary">
                {isAr ? "المبلغ:" : "Amount:"}{" "}
                <span className="font-bold text-[#25D366]">{formatIqd(amount, locale)}</span>
              </p>

              {phase === "idle" && (
                <Button
                  type="button"
                  disabled={disabled}
                  onClick={startRedirect}
                  className="w-full bg-[#25D366] text-white hover:bg-[#1fb855]"
                >
                  <ExternalLink className="size-4" />
                  {isAr ? "الانتقال إلى زين كاش" : "Continue to Zain Cash"}
                </Button>
              )}

              {phase === "redirecting" && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 py-4 text-sm text-[#25D366]">
                  <Loader2 className="size-4 animate-spin" />
                  {isAr ? "جاري فتح تطبيق زين كاش..." : "Opening Zain Cash app..."}
                </div>
              )}

              {phase === "returned" && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 py-4 text-sm text-[#25D366]">
                  <Loader2 className="size-4 animate-spin" />
                  {isAr ? "جاري تأكيد الدفع..." : "Confirming payment..."}
                </div>
              )}

              {phase === "success" && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 py-4 text-sm font-semibold text-[#25D366]">
                  <CheckCircle2 className="size-4" />
                  {isAr ? "تم الدفع بنجاح" : "Payment successful"}
                </div>
              )}
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
