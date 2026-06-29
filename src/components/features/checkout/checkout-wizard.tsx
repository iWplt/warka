"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Minus, Plus, Upload, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { createOrder } from "@/server/actions/orders";
import { GRADUATION_PRODUCT_META } from "@/lib/constants/graduation-products";
import { formatIqd } from "@/lib/format/currency";
import { validateImageFile } from "@/lib/upload/validate";
import { useCheckoutStore } from "@/stores/checkout-store";
import type { PriceCatalogItem, ProductType, Profile } from "@/types/database";
import { cn } from "@/lib/utils";

type CheckoutWizardProps = {
  prices: PriceCatalogItem[];
  profile: Profile;
  initialProduct?: ProductType;
  initialCatalogProductId?: string;
  catalogProducts?: Array<{
    id: string;
    product_type: ProductType;
    name_ar: string;
    name_en: string;
    price: number;
    image: string | null;
    category_name_ar?: string;
    category_name_en?: string;
  }>;
};

export function CheckoutWizard({
  prices,
  profile,
  initialProduct,
  initialCatalogProductId,
  catalogProducts = [],
}: CheckoutWizardProps) {
  const STEPS = [
    { ar: "المنتج", en: "Product" },
    { ar: "البيانات", en: "Details" },
    { ar: "الشعار", en: "Logo" },
    { ar: "المراجعة", en: "Review" },
    { ar: "التأكيد", en: "Confirm" },
  ] as const;

  const COLOR_HEX: Record<string, string> = {
    أسود: "#1a1a1a",
    بيج: "#c4a882",
    زيتوني: "#556b2f",
    كريمي: "#f5f0e6",
  };

  const t = useTranslations();
  const orderT = useTranslations("studentOrder");
  const productT = useTranslations("productType");
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    step,
    productType,
    catalogProductId,
    unitPrice: storeUnitPrice,
    quantity,
    sashColor,
    fabricType,
    fabricLabel,
    notes,
    logoDataUrl,
    studentData,
    setStep,
    setProduct,
    setCatalogProduct,
    setQuantity,
    setSashColor,
    setNotes,
    setLogoDataUrl,
    setStudentData,
    reset,
  } = useCheckoutStore();

  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(logoDataUrl);

  const availableProducts = useMemo(
    () =>
      GRADUATION_PRODUCT_META.filter((meta) =>
        prices.some((p) => p.product_type === meta.productType && p.active)
      ),
    [prices]
  );

  useEffect(() => {
    setStudentData({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      college: profile.college ?? "",
      department: profile.department ?? "",
      graduation_year: profile.graduation_year
        ? String(profile.graduation_year)
        : String(new Date().getFullYear()),
    });
  }, [profile, setStudentData]);

  useEffect(() => {
    if (initialCatalogProductId && catalogProducts.length > 0) {
      const item = catalogProducts.find((p) => p.id === initialCatalogProductId);
      if (item) {
        setCatalogProduct(item.id, item.product_type, Number(item.price), quantity);
        return;
      }
    }
    if (initialProduct && availableProducts.some((p) => p.productType === initialProduct)) {
      setProduct(initialProduct);
    }
  }, [
    initialProduct,
    initialCatalogProductId,
    catalogProducts,
    availableProducts,
    setProduct,
    setCatalogProduct,
    quantity,
  ]);

  const selectedCatalog = catalogProducts.find((p) => p.id === catalogProductId);
  const selectedMeta = availableProducts.find((p) => p.productType === productType);
  const unitPrice =
    catalogProductId && storeUnitPrice > 0
      ? storeUnitPrice
      : Number(prices.find((p) => p.product_type === productType)?.base_price ?? 0);
  const lineTotal = unitPrice * quantity;

  const handleLogoChange = (file: File | undefined) => {
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoPreview(reader.result);
        setLogoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setLogoPreview(null);
    setLogoDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canProceedStep1 = productType && selectedMeta;
  const canProceedStep2 = studentData.full_name.trim().length > 0;

  const goNext = () => {
    if (step === 1 && !canProceedStep1) {
      toast.error(orderT("selectProduct"));
      return;
    }
    if (step === 2 && !canProceedStep2) {
      toast.error(locale === "ar" ? "أدخل الاسم الكامل" : "Enter full name");
      return;
    }
    setStep(Math.min(5, step + 1));
  };

  const goBack = () => setStep(Math.max(1, step - 1));

  const handleSubmit = async () => {
    if (!productType || !selectedMeta) {
      toast.error(orderT("selectProduct"));
      return;
    }

    setLoading(true);
    try {
      const order = await createOrder({
        type: "individual",
        notes: notes.trim() || undefined,
        logo_data_url: logoDataUrl ?? undefined,
        student_profile: {
          full_name: studentData.full_name.trim() || undefined,
          phone: studentData.phone.trim() || undefined,
          college: studentData.college.trim() || undefined,
          department: studentData.department.trim() || undefined,
          graduation_year: studentData.graduation_year
            ? Number(studentData.graduation_year)
            : undefined,
        },
        items: [
          {
            product_type: productType,
            catalog_product_id: catalogProductId ?? undefined,
            product_label: selectedCatalog
              ? locale === "ar"
                ? selectedCatalog.name_ar
                : selectedCatalog.name_en
              : undefined,
            sash_color: sashColor,
            fabric_type: fabricType || undefined,
            special_notes: [
              quantity > 1 ? `Quantity: ${quantity}` : null,
              fabricLabel ? `Fabric: ${fabricLabel}` : null,
            ]
              .filter(Boolean)
              .join(" | ") || undefined,
            unit_price: lineTotal,
          },
        ],
      });

      toast.success(t("common.success"));
      reset();
      const dest =
        profile.role === "representative"
          ? `/representative/orders/${order.id}`
          : `/student/orders/${order.id}`;
      router.push(dest);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  if (availableProducts.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={orderT("noProducts")}
        description={orderT("noProductsHint")}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-warka-text">
          {locale === "ar" ? "إتمام الطلب" : "Checkout"}
        </h1>
        <p className="mt-1 text-sm text-warka-text-secondary">
          {locale === "ar"
            ? "أكمل الخطوات التالية لتقديم طلبك"
            : "Complete the steps below to place your order"}
        </p>
      </div>

      <nav aria-label={locale === "ar" ? "تقدم الطلب" : "Checkout progress"}>
        <ol className="flex items-center justify-between">
          {STEPS.map((s, index) => {
            const stepNum = index + 1;
            const done = step > stepNum;
            const active = step === stepNum;
            return (
              <li key={s.ar} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {index > 0 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1",
                        done || active ? "bg-warka-primary" : "bg-warka-border"
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                      done
                        ? "border-warka-primary bg-warka-primary text-white"
                        : active
                          ? "border-warka-primary bg-warka-primary/10 text-warka-primary"
                          : "border-warka-border bg-white text-warka-text-muted"
                    )}
                  >
                    {done ? "✓" : stepNum}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1",
                        done ? "bg-warka-primary" : "bg-warka-border"
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 hidden text-xs sm:block",
                    active ? "font-semibold text-warka-primary" : "text-warka-text-muted"
                  )}
                >
                  {locale === "ar" ? s.ar : s.en}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 1 && (
        <WarkaCard className="space-y-6">
          <WarkaCardTitle>{orderT("selectProduct")}</WarkaCardTitle>
          {catalogProducts.length > 0 ? (
            <div className="space-y-6">
              {Array.from(
                catalogProducts.reduce((map, item) => {
                  const key = item.category_name_ar ?? item.product_type;
                  if (!map.has(key)) map.set(key, []);
                  map.get(key)!.push(item);
                  return map;
                }, new Map<string, typeof catalogProducts>())
              ).map(([section, items]) => (
                <div key={section}>
                  <p className="mb-3 text-sm font-semibold text-warka-primary">{section}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((item) => {
                      const active = catalogProductId === item.id;
                      const label = locale === "ar" ? item.name_ar : item.name_en;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setCatalogProduct(
                              item.id,
                              item.product_type,
                              Number(item.price),
                              quantity
                            )
                          }
                          className={cn(
                            "rounded-xl border-2 p-4 text-start transition-all",
                            active
                              ? "border-warka-primary bg-warka-primary/5"
                              : "border-warka-border bg-white hover:border-warka-primary/40"
                          )}
                        >
                          <p className="font-semibold text-warka-text">{label}</p>
                          <p className="mt-1 text-sm text-warka-text-secondary">
                            {formatIqd(Number(item.price), locale)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableProducts.map((meta) => {
                const price = prices.find((p) => p.product_type === meta.productType);
                const active = productType === meta.productType;
                return (
                  <button
                    key={meta.productType}
                    type="button"
                    onClick={() => setProduct(meta.productType, quantity)}
                    className={cn(
                      "rounded-xl border-2 p-4 text-start transition-all",
                      active
                        ? "border-warka-primary bg-warka-primary/5"
                        : "border-warka-border bg-white hover:border-warka-primary/40"
                    )}
                  >
                    <p className="font-semibold text-warka-text">{productT(meta.productType)}</p>
                    <p className="mt-1 text-sm text-warka-text-secondary">
                      {formatIqd(Number(price?.base_price ?? 0), locale)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <div>
            <Label className="text-sm font-semibold text-warka-text">{orderT("quantity")}</Label>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex size-10 items-center justify-center rounded-xl border border-warka-border text-warka-text hover:bg-warka-bg disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <Input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.min(99, Math.max(1, Number(e.target.value) || 1)))
                }
                className="w-20 border-warka-border text-center"
              />
              <button
                type="button"
                disabled={quantity >= 99}
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                className="flex size-10 items-center justify-center rounded-xl border border-warka-border text-warka-text hover:bg-warka-bg disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {productType === "sash" && (
            <div>
              <Label className="text-sm font-semibold text-warka-text">
                {locale === "ar" ? "لون الوشاح" : "Sash color"}
              </Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {["أسود", "بيج", "زيتوني", "كريمي"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSashColor(color)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm",
                      sashColor === color
                        ? "border-warka-primary bg-warka-primary/5"
                        : "border-warka-border hover:border-warka-primary/40"
                    )}
                  >
                    <span
                      className="size-4 rounded-full border border-warka-border"
                      style={{ backgroundColor: COLOR_HEX[color] ?? "#ccc" }}
                    />
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedMeta && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-warka-bg">
              <Image
                src={selectedMeta.image}
                alt={productT(productType!)}
                fill
                className="object-cover"
                sizes="600px"
              />
            </div>
          )}
        </WarkaCard>
      )}

      {step === 2 && (
        <WarkaCard className="space-y-4">
          <WarkaCardTitle>
            {locale === "ar" ? "بيانات الطالب" : "Student information"}
          </WarkaCardTitle>
          {(
            [
              ["full_name", locale === "ar" ? "الاسم الكامل" : "Full name", true],
              ["phone", locale === "ar" ? "الهاتف" : "Phone", false],
              ["college", locale === "ar" ? "الكلية" : "College", false],
              ["department", locale === "ar" ? "القسم" : "Department", false],
              ["graduation_year", locale === "ar" ? "سنة التخرج" : "Graduation year", false],
            ] as const
          ).map(([key, label, required]) => (
            <div key={key}>
              <Label htmlFor={`checkout-${key}`} className="text-sm font-semibold text-warka-text">
                {label}
              </Label>
              <Input
                id={`checkout-${key}`}
                value={studentData[key]}
                onChange={(e) => setStudentData({ [key]: e.target.value })}
                required={required}
                className="mt-1.5 border-warka-border"
              />
            </div>
          ))}
          <div>
            <Label htmlFor="checkout-notes" className="text-sm font-semibold text-warka-text">
              {t("orders.specialNotes")}
            </Label>
            <textarea
              id="checkout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-warka-border bg-warka-bg px-4 py-3 text-sm text-warka-text focus:border-warka-primary focus:outline-none"
              placeholder={orderT("notesPlaceholder")}
            />
          </div>
        </WarkaCard>
      )}

      {step === 3 && (
        <WarkaCard>
          <WarkaCardTitle>{t("orders.uploadLogo")}</WarkaCardTitle>
          <p className="mt-1 text-xs text-warka-text-muted">{orderT("logoOptional")}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleLogoChange(e.target.files?.[0])}
          />
          <label
            className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-warka-border bg-warka-bg px-6 py-10 transition-colors hover:border-warka-primary/50"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            <Upload className="mb-2 h-8 w-8 text-warka-text-muted" />
            <span className="text-sm text-warka-text-secondary">
              {locale === "ar"
                ? "اضغط لرفع الشعار أو اسحب وأفلت"
                : "Click or drag to upload logo"}
            </span>
            <span className="mt-1 text-xs text-warka-text-muted">PNG, JPG — max 2MB</span>
          </label>
          {logoPreview && (
            <div className="relative mt-4 flex items-center gap-3">
              <div className="relative size-24 overflow-hidden rounded-xl border border-warka-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoPreview} alt="" className="size-full object-contain" />
              </div>
              <button
                type="button"
                onClick={clearLogo}
                className="text-sm text-red-600 hover:underline"
              >
                {orderT("removeLogo")}
              </button>
            </div>
          )}
        </WarkaCard>
      )}

      {step === 4 && (
        <WarkaCard className="space-y-4">
          <WarkaCardTitle>{locale === "ar" ? "ملخص الطلب" : "Order summary"}</WarkaCardTitle>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-warka-text-secondary">{orderT("selectProduct")}</dt>
              <dd className="font-medium text-warka-text">
                {productType ? productT(productType) : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-warka-text-secondary">{orderT("quantity")}</dt>
              <dd className="font-medium text-warka-text">{quantity}</dd>
            </div>
            {sashColor && (
              <div className="flex justify-between gap-4">
                <dt className="text-warka-text-secondary">
                  {locale === "ar" ? "اللون" : "Color"}
                </dt>
                <dd className="font-medium text-warka-text">{sashColor}</dd>
              </div>
            )}
            {fabricLabel && (
              <div className="flex justify-between gap-4">
                <dt className="text-warka-text-secondary">
                  {locale === "ar" ? "القماش" : "Fabric"}
                </dt>
                <dd className="font-medium text-warka-text">{fabricLabel}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-warka-text-secondary">
                {locale === "ar" ? "الاسم" : "Name"}
              </dt>
              <dd className="font-medium text-warka-text">{studentData.full_name || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-warka-text-secondary">
                {locale === "ar" ? "الهاتف" : "Phone"}
              </dt>
              <dd className="font-medium text-warka-text">{studentData.phone || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-warka-text-secondary">{orderT("unitPrice")}</dt>
              <dd className="font-medium text-warka-text">
                {formatIqd(Number(unitPrice), locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-warka-border pt-3">
              <dt className="font-semibold text-warka-text">{t("common.total")}</dt>
              <dd className="text-lg font-bold text-warka-text">
                {formatIqd(lineTotal, locale)}
              </dd>
            </div>
          </dl>
        </WarkaCard>
      )}

      {step === 5 && (
        <WarkaCard className="space-y-4 text-center">
          <WarkaCardTitle>{locale === "ar" ? "تأكيد الطلب" : "Confirm order"}</WarkaCardTitle>
          <p className="text-sm text-warka-text-secondary">
            {locale === "ar"
              ? "بالضغط على «إرسال الطلب» سيتم إنشاء طلبك وإرساله للمطبعة."
              : "By submitting, your order will be created and sent to the print shop."}
          </p>
          <p className="text-2xl font-bold text-warka-primary">{formatIqd(lineTotal, locale)}</p>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="w-full rounded-xl bg-warka-primary py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark disabled:opacity-60"
          >
            {loading ? t("common.loading") : orderT("placeOrder")}
          </button>
        </WarkaCard>
      )}

      <div className="flex items-center justify-between gap-4 pb-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1 rounded-xl border border-warka-border px-4 py-2.5 text-sm font-medium text-warka-text hover:bg-white"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
            {locale === "ar" ? "السابق" : "Back"}
          </button>
        ) : (
          <span />
        )}
        {step < 5 && (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1 rounded-xl bg-warka-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-warka-primary-dark"
          >
            {locale === "ar" ? "التالي" : "Next"}
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
}
