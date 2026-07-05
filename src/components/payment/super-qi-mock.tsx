"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatIqd } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

type SuperQiMockProps = {
  selected: boolean;
  onSelect: () => void;
  locale: "ar" | "en";
  amount: number;
  onPaid?: () => void;
  disabled?: boolean;
};

export function SuperQiMock({
  selected,
  onSelect,
  locale,
  amount,
  onPaid,
  disabled,
}: SuperQiMockProps) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const isAr = locale === "ar";

  const handlePay = async () => {
    if (paying || paid) return;
    setPaying(true);
    toast.loading(isAr ? "جاري الدفع عبر سوبر كي..." : "Processing Super Qi payment...", {
      id: "super-qi-pay",
    });

    await new Promise((resolve) => setTimeout(resolve, 1800));

    setPaying(false);
    setPaid(true);
    toast.success(isAr ? "تم الدفع بنجاح عبر سوبر كي" : "Super Qi payment successful", {
      id: "super-qi-pay",
    });
    onPaid?.();
  };

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-card p-4 transition-all",
        selected ? "border-warka-primary shadow-card" : "border-warka-border hover:border-warka-primary/40"
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="radio"
          name="payment-method"
          checked={selected}
          onChange={onSelect}
          disabled={disabled}
          className="mt-1 size-4 accent-warka-primary"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#6B2D8B]/10 text-[#6B2D8B]">
              <Smartphone className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-warka-text">
                {isAr ? "سوبر كي" : "Super Qi"}
              </p>
              <p className="text-xs text-warka-text-muted">
                {isAr ? "محفظة رقمية عراقية" : "Iraqi digital wallet"}
              </p>
            </div>
          </div>

          {selected && (
            <div className="mt-4 space-y-3 border-t border-warka-border pt-4">
              <p className="text-sm text-warka-text-secondary">
                {isAr ? "المبلغ المطلوب:" : "Amount due:"}{" "}
                <span className="font-bold text-warka-primary">{formatIqd(amount, locale)}</span>
              </p>
              <Button
                type="button"
                disabled={paying || paid || disabled}
                onClick={handlePay}
                className="w-full bg-[#6B2D8B] hover:bg-[#5a2573]"
              >
                {paying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {isAr ? "جاري الدفع..." : "Paying..."}
                  </>
                ) : paid ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    {isAr ? "تم الدفع" : "Paid"}
                  </>
                ) : (
                  isAr ? "ادفع عبر سوبر كي" : "Pay with Super Qi"
                )}
              </Button>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
