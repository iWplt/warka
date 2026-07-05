"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIqd } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

type AsiaHawalaMockProps = {
  selected: boolean;
  onSelect: () => void;
  locale: "ar" | "en";
  amount: number;
  onPaid?: () => void;
  disabled?: boolean;
};

export function AsiaHawalaMock({
  selected,
  onSelect,
  locale,
  amount,
  onPaid,
  disabled,
}: AsiaHawalaMockProps) {
  const [reference, setReference] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const isAr = locale === "ar";

  const handlePay = async () => {
    if (paying || paid) return;
    if (reference.trim().length < 4) {
      toast.error(isAr ? "أدخل رقم الحوالة (4 أرقام على الأقل)" : "Enter transfer reference (min 4 digits)");
      return;
    }

    setPaying(true);
    toast.loading(isAr ? "جاري التحقق من الحوالة..." : "Verifying transfer...", {
      id: "asia-hawala-pay",
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setPaying(false);
    setPaid(true);
    toast.success(isAr ? "تم تأكيد الدفع عبر آسيا حوالة" : "Asia Hawala payment confirmed", {
      id: "asia-hawala-pay",
    });
    onPaid?.();
  };

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-card p-4 transition-all",
        selected ? "border-[#1E5AA8] shadow-card" : "border-warka-border hover:border-[#1E5AA8]/40"
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="radio"
          name="payment-method"
          checked={selected}
          onChange={onSelect}
          disabled={disabled}
          className="mt-1 size-4 accent-[#1E5AA8]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#1E5AA8]/10 text-[#1E5AA8]">
              <Building2 className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-warka-text">
                {isAr ? "آسيا حوالة" : "Asia Hawala"}
              </p>
              <p className="text-xs text-warka-text-muted">
                {isAr ? "تحويل بنكي / حوالة" : "Bank transfer / hawala"}
              </p>
            </div>
          </div>

          {selected && (
            <div className="mt-4 space-y-3 border-t border-warka-border pt-4">
              <p className="text-sm text-warka-text-secondary">
                {isAr ? "المبلغ المطلوب:" : "Amount due:"}{" "}
                <span className="font-bold text-[#1E5AA8]">{formatIqd(amount, locale)}</span>
              </p>

              <div className="space-y-2">
                <Label htmlFor="asia-hawala-ref" className="text-warka-text-secondary">
                  {isAr ? "رقم الحوالة" : "Transfer reference"}
                </Label>
                <Input
                  id="asia-hawala-ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={isAr ? "مثال: 482910" : "e.g. 482910"}
                  disabled={paying || paid || disabled}
                  className="border-warka-border focus-visible:ring-[#1E5AA8]"
                />
              </div>

              <Button
                type="button"
                disabled={paying || paid || disabled}
                onClick={handlePay}
                className="w-full bg-[#1E5AA8] hover:bg-[#174a8c]"
              >
                {paying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {isAr ? "جاري التحقق..." : "Verifying..."}
                  </>
                ) : paid ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    {isAr ? "تم التأكيد" : "Confirmed"}
                  </>
                ) : (
                  isAr ? "تأكيد الدفع" : "Confirm payment"
                )}
              </Button>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
