"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  Palette,
  Package,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { createOrder } from "@/server/actions/orders";
import {
  PaymentMethodsStep,
  type PaymentMethodId,
} from "@/components/payment/payment-methods-step";
import { IRAQI_GOVERNORATES } from "@/lib/constants/iraq-market";
import { formatIqd } from "@/lib/format/currency";
import { getSizeOptions, productNeedsSize } from "@/lib/cart/sizes";
import { validateImageFile } from "@/lib/upload/validate";
import { useCartStore, type CartLineItem } from "@/stores/cart-store";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";

type CartCheckoutWizardProps = {
  profile: Profile;
};

const STEPS = [
  { ar: "التخصيص", en: "Customize" },
  { ar: "البيانات", en: "Details" },
  { ar: "المراجعة", en: "Review" },
  { ar: "الدفع", en: "Payment" },
  { ar: "التأكيد", en: "Confirm" },
] as const;

export function CartCheckoutWizard({ profile }: CartCheckoutWizardProps) {
  const t = useTranslations("cart");
  const authT = useTranslations("auth");
  const orderT = useTranslations("studentOrder");
  const locale = useLocale();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const updateLine = useCartStore((s) => s.updateLine);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeLineId, setActiveLineId] = useState<string | null>(items[0]?.id ?? null);

  const [studentData, setStudentData] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    college: profile.college ?? "",
    department: profile.department ?? "",
    graduation_year: profile.graduation_year
      ? String(profile.graduation_year)
      : String(new Date().getFullYear()),
  });
  const [deliveryData, setDeliveryData] = useState<{
    governorate: string;
    area: string;
    phone: string;
    preferred_date: string;
  }>({
    governorate: IRAQI_GOVERNORATES[0].en,
    area: "",
    phone: profile.phone ?? "",
    preferred_date: "",
  });
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("zain_cash");
  const [paymentReceipt, setPaymentReceipt] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  const total = subtotal();
  const activeLine = items.find((l) => l.id === activeLineId) ?? items[0];

  const allSized = useMemo(
    () =>
      items.every((line) => {
        if (!productNeedsSize(line.productType)) return true;
        return line.size.trim().length > 0;
      }),
    [items]
  );

  const handleLogo = (lineId: string, file: File | undefined) => {
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateLine(lineId, { logoDataUrl: reader.result, customized: true });
      }
    };
    reader.readAsDataURL(file);
  };

  const goNext = () => {
    if (step === 1 && !allSized) {
      toast.error(t("sizeRequired"));
      return;
    }
    if (step === 2) {
      if (!studentData.full_name.trim()) {
        toast.error(locale === "ar" ? "أدخل الاسم الكامل" : "Enter full name");
        return;
      }
      if (!deliveryData.governorate) {
        toast.error(locale === "ar" ? "اختر المحافظة" : "Select governorate");
        return;
      }
      if (!deliveryData.area.trim()) {
        toast.error(locale === "ar" ? "أدخل المنطقة / الحي" : "Enter area / district");
        return;
      }
      if (!deliveryData.phone.trim() || deliveryData.phone.trim().length < 7) {
        toast.error(locale === "ar" ? "أدخل رقم هاتف صحيح" : "Enter a valid phone number");
        return;
      }
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const totalWithCod = total;

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const gov = IRAQI_GOVERNORATES.find((g) => g.en === deliveryData.governorate);
      const govLabel = locale === "ar" ? gov?.ar : gov?.en;
      const deliveryNote = [
        locale === "ar" ? `المحافظة: ${govLabel}` : `Governorate: ${govLabel}`,
        locale === "ar" ? `المنطقة: ${deliveryData.area.trim()}` : `Area: ${deliveryData.area.trim()}`,
        locale === "ar" ? `هاتف التوصيل: ${deliveryData.phone.trim()}` : `Delivery phone: ${deliveryData.phone.trim()}`,
        deliveryData.preferred_date
          ? locale === "ar"
            ? `تاريخ التسليم المطلوب (ميلادي): ${deliveryData.preferred_date}`
            : `Preferred delivery (Gregorian): ${deliveryData.preferred_date}`
          : null,
      ]
        .filter(Boolean)
        .join(" | ");

      const order = await createOrder({
        type: "individual",
        notes: [deliveryNote, orderNotes.trim() || null].filter(Boolean).join("\n"),
        student_profile: {
          full_name: studentData.full_name.trim() || undefined,
          phone: deliveryData.phone.trim() || studentData.phone.trim() || undefined,
          college: studentData.college.trim() || undefined,
          department: studentData.department.trim() || undefined,
          graduation_year: studentData.graduation_year
            ? Number(studentData.graduation_year)
            : undefined,
        },
        items: items.map((line) => buildOrderItem(line)),
      });

      clearCart();
      toast.success(t("orderPlaced"));
      const dest =
        profile.role === "representative"
          ? `/representative/orders/${order.id}`
          : `/student/orders/${order.id}`;
      router.push(dest);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("orderError"));
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warka-primary">WARKA</p>
        <h1 className="mt-1 text-2xl font-bold text-warka-text">{t("checkoutTitle")}</h1>
        <p className="mt-1 text-sm text-warka-text-secondary">{t("checkoutSubtitle")}</p>
      </div>

      <div className="mb-8 flex gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div
              key={s.en}
              className={cn(
                "flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-center transition-colors",
                active && "bg-warka-primary/10",
                done && "opacity-80"
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold",
                  active || done
                    ? "bg-warka-primary text-white"
                    : "bg-warka-bg text-warka-text-muted"
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : n}
              </span>
              <span className="text-[10px] font-medium text-warka-text-secondary">
                {locale === "ar" ? s.ar : s.en}
              </span>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <WarkaCard>
            <WarkaCardTitle className="mb-2">{t("customizeTitle")}</WarkaCardTitle>
            <p className="mb-4 text-sm text-warka-text-secondary">{t("customizeHint")}</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {items.map((line) => {
                const name = locale === "ar" ? line.name_ar : line.name_en;
                return (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => setActiveLineId(line.id)}
                    className={cn(
                      "shrink-0 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-colors",
                      activeLineId === line.id
                        ? "border-warka-primary bg-warka-primary/5 text-warka-primary"
                        : "border-warka-border text-warka-text-secondary"
                    )}
                  >
                    {name}
                    {line.quantity > 1 ? ` ×${line.quantity}` : ""}
                  </button>
                );
              })}
            </div>
          </WarkaCard>

          {activeLine && (
            <CustomizeLineCard
              line={activeLine}
              locale={locale}
              onSize={(size) => updateLine(activeLine.id, { size, customized: true })}
              onNotes={(notes) => updateLine(activeLine.id, { notes, customized: true })}
              onLogo={(file) => handleLogo(activeLine.id, file)}
              onClearLogo={() => updateLine(activeLine.id, { logoDataUrl: null })}
              t={t}
              orderT={orderT}
            />
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <WarkaCard className="space-y-4">
            <WarkaCardTitle>{authT("registerTitle")}</WarkaCardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-warka-text">{authT("fullName")}</Label>
                <Input
                  value={studentData.full_name}
                  onChange={(e) => setStudentData({ ...studentData, full_name: e.target.value })}
                  className="mt-1 border-warka-border"
                />
              </div>
              <div>
                <Label className="text-warka-text">{authT("college")}</Label>
                <Input
                  value={studentData.college}
                  onChange={(e) => setStudentData({ ...studentData, college: e.target.value })}
                  className="mt-1 border-warka-border"
                />
              </div>
              <div>
                <Label className="text-warka-text">{authT("department")}</Label>
                <Input
                  value={studentData.department}
                  onChange={(e) => setStudentData({ ...studentData, department: e.target.value })}
                  className="mt-1 border-warka-border"
                />
              </div>
              <div>
                <Label className="text-warka-text">{authT("graduationYear")}</Label>
                <Input
                  value={studentData.graduation_year}
                  onChange={(e) =>
                    setStudentData({ ...studentData, graduation_year: e.target.value })
                  }
                  className="mt-1 border-warka-border"
                />
              </div>
            </div>
          </WarkaCard>

          <WarkaCard className="space-y-4">
            <WarkaCardTitle>
              {locale === "ar" ? "عنوان التوصيل" : "Delivery address"}
            </WarkaCardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-warka-text">
                  {locale === "ar" ? "المحافظة *" : "Governorate *"}
                </Label>
                <select
                  required
                  value={deliveryData.governorate}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, governorate: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-warka-border bg-card px-3 py-2.5 text-sm text-warka-text focus:outline-none focus:ring-2 focus:ring-warka-primary"
                >
                  {IRAQI_GOVERNORATES.map((g) => (
                    <option key={g.en} value={g.en}>
                      {locale === "ar" ? g.ar : g.en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-warka-text">
                  {locale === "ar" ? "المنطقة / الحي *" : "Area / district *"}
                </Label>
                <Input
                  required
                  value={deliveryData.area}
                  onChange={(e) => setDeliveryData({ ...deliveryData, area: e.target.value })}
                  placeholder={locale === "ar" ? "مثال: الكرادة، الجامعة" : "e.g. Karrada, University"}
                  className="mt-1 border-warka-border"
                />
              </div>
              <div>
                <Label className="text-warka-text">
                  {locale === "ar" ? "رقم الهاتف *" : "Phone number *"}
                </Label>
                <Input
                  type="tel"
                  required
                  dir="ltr"
                  value={deliveryData.phone}
                  onChange={(e) => setDeliveryData({ ...deliveryData, phone: e.target.value })}
                  placeholder="07XX XXX XXXX"
                  className="mt-1 border-warka-border text-left"
                />
              </div>
              <div>
                <Label className="text-warka-text">
                  {locale === "ar" ? "تاريخ التسليم المطلوب (ميلادي)" : "Preferred delivery (Gregorian)"}
                </Label>
                <Input
                  type="date"
                  value={deliveryData.preferred_date}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, preferred_date: e.target.value })
                  }
                  className="mt-1 border-warka-border"
                />
              </div>
            </div>
            <div>
              <Label className="text-warka-text">{t("orderNotes")}</Label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-warka-border bg-card px-3 py-2 text-sm text-warka-text"
              />
            </div>
          </WarkaCard>
        </div>
      )}

      {step === 3 && (
        <WarkaCard className="space-y-4">
          <WarkaCardTitle>{t("reviewTitle")}</WarkaCardTitle>
          <div className="rounded-xl border border-warka-border bg-warka-bg/30 p-3 text-sm">
            <p className="font-semibold text-warka-text">
              {locale === "ar" ? "التوصيل" : "Delivery"}
            </p>
            <p className="mt-1 text-warka-text-secondary">
              {(() => {
                const gov = IRAQI_GOVERNORATES.find((g) => g.en === deliveryData.governorate);
                const govLabel = locale === "ar" ? gov?.ar : gov?.en;
                return `${govLabel} — ${deliveryData.area}`;
              })()}
            </p>
            <p className="text-warka-text-secondary" dir="ltr">
              {deliveryData.phone}
            </p>
            {deliveryData.preferred_date && (
              <p className="text-warka-text-secondary">
                {locale === "ar" ? "التسليم: " : "Delivery: "}
                {deliveryData.preferred_date}
              </p>
            )}
          </div>
          {items.map((line) => (
            <ReviewLine key={line.id} line={line} locale={locale} />
          ))}
          <div className="border-t border-warka-border pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>{t("total")}</span>
              <span className="text-warka-primary">{formatIqd(total, locale)}</span>
            </div>
          </div>
        </WarkaCard>
      )}

      {step === 4 && (
        <PaymentMethodsStep
          locale={locale === "ar" ? "ar" : "en"}
          selectedMethod={paymentMethod}
          onSelect={setPaymentMethod}
          receiptDataUrl={paymentReceipt}
          onReceiptChange={setPaymentReceipt}
          onPaid={() => setPaymentConfirmed(true)}
          total={totalWithCod}
        />
      )}

      {step === 5 && (
        <WarkaCard className="space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-warka-primary/10">
            <Package className="size-8 text-warka-primary" />
          </div>
          <WarkaCardTitle>{t("confirmTitle")}</WarkaCardTitle>
          <p className="text-sm text-warka-text-secondary">{t("confirmHint")}</p>
          <p className="text-2xl font-bold text-warka-primary">
            {formatIqd(totalWithCod, locale)}
          </p>
          <p className="text-sm text-warka-text-secondary">
            {locale === "ar" ? "طريقة الدفع:" : "Payment:"} {paymentMethod}
            {paymentConfirmed ? " ✓" : ""}
          </p>
          <p className="text-sm text-warka-text-secondary">
            {t("itemCount", { count: items.reduce((n, i) => n + i.quantity, 0) })}
          </p>
        </WarkaCard>
      )}

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => (step === 1 ? router.push("/cart") : setStep((s) => s - 1))}
          className="inline-flex items-center gap-2 rounded-xl border border-warka-border px-4 py-2.5 text-sm font-medium text-warka-text hover:bg-warka-bg"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
          {step === 1 ? t("backToCart") : t("back")}
        </button>

        {step < 5 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-xl bg-warka-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-warka-primary-dark"
          >
            {t("continue")}
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center gap-2 rounded-xl bg-warka-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-warka-primary-dark disabled:opacity-60"
          >
            {loading ? t("placing") : t("placeOrder")}
          </button>
        )}
      </div>
    </div>
  );
}

function buildOrderItem(line: CartLineItem) {
  return {
    product_type: line.productType,
    catalog_product_id: line.catalogProductId,
    product_label: line.name_ar,
    sash_color: line.colorLabel || undefined,
    fabric_type: line.fabricKey || undefined,
    size: line.size || undefined,
    special_notes: [
      line.notes.trim() || null,
      line.fabricLabel ? `Fabric: ${line.fabricLabel}` : null,
      line.quantity > 1 ? `Qty: ${line.quantity}` : null,
    ]
      .filter(Boolean)
      .join(" | ") || undefined,
    unit_price: line.unitPrice * line.quantity,
    logo_data_url: line.logoDataUrl ?? undefined,
  };
}

type CustomizeLineCardProps = {
  line: CartLineItem;
  locale: string;
  onSize: (size: string) => void;
  onNotes: (notes: string) => void;
  onLogo: (file: File | undefined) => void;
  onClearLogo: () => void;
  t: ReturnType<typeof useTranslations<"cart">>;
  orderT: ReturnType<typeof useTranslations<"studentOrder">>;
};

function CustomizeLineCard({
  line,
  locale,
  onSize,
  onNotes,
  onLogo,
  onClearLogo,
  t,
  orderT,
}: CustomizeLineCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const name = locale === "ar" ? line.name_ar : line.name_en;
  const sizes = getSizeOptions(line.productType, locale === "ar" ? "ar" : "en");

  return (
    <WarkaCard>
      <div className="flex gap-4">
        <div className="relative hidden size-24 shrink-0 overflow-hidden rounded-xl bg-warka-bg sm:block">
          <Image src={line.image} alt={name} fill className="object-cover" sizes="96px" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h3 className="font-bold text-warka-text">{name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-warka-bg px-2 py-1 text-xs">
                <Palette className="size-3" />
                {line.colorLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-warka-bg px-2 py-1 text-xs">
                <Sparkles className="size-3 text-warka-primary" />
                {line.fabricLabel}
              </span>
            </div>
          </div>

          {sizes.length > 0 && (
            <div>
              <Label>{t("size")}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onSize(size)}
                    className={cn(
                      "rounded-lg border-2 px-3 py-1.5 text-sm font-medium",
                      line.size === size
                        ? "border-warka-primary bg-warka-primary/5"
                        : "border-warka-border"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>{t("lineNotes")}</Label>
            <textarea
              value={line.notes}
              onChange={(e) => onNotes(e.target.value)}
              rows={2}
              placeholder={t("lineNotesPlaceholder")}
              className="mt-1 w-full rounded-xl border border-warka-border bg-card px-3 py-2 text-sm text-warka-text"
            />
          </div>

          <div>
            <Label>{t("uploadLogo")}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onLogo(e.target.files?.[0])}
            />
            {line.logoDataUrl ? (
              <div className="mt-2 flex items-center gap-3">
                <div className="relative size-16 overflow-hidden rounded-lg border border-warka-border">
                  <Image src={line.logoDataUrl} alt="" fill className="object-contain" />
                </div>
                <button
                  type="button"
                  onClick={onClearLogo}
                  className="text-sm text-red-600 hover:underline"
                >
                  {orderT("removeLogo")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-warka-border py-6 text-sm text-warka-text-secondary hover:border-warka-primary hover:text-warka-primary"
              >
                <Upload className="size-4" />
                {t("uploadLogo")}
              </button>
            )}
          </div>
        </div>
      </div>
    </WarkaCard>
  );
}

function ReviewLine({ line, locale }: { line: CartLineItem; locale: string }) {
  const name = locale === "ar" ? line.name_ar : line.name_en;
  return (
    <div className="flex gap-3 rounded-xl border border-warka-border bg-warka-bg/30 p-3">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
        <Image src={line.image} alt={name} fill className="object-cover" sizes="64px" />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-warka-text">{name}</p>
        <p className="text-warka-text-secondary">
          {line.colorLabel} · {line.fabricLabel}
          {line.size ? ` · ${line.size}` : ""}
        </p>
        <p className="mt-1 font-medium text-warka-primary">
          {formatIqd(line.unitPrice * line.quantity, locale)}
          {line.quantity > 1 && (
            <span className="text-warka-text-muted"> ({line.quantity}×)</span>
          )}
        </p>
      </div>
    </div>
  );
}
