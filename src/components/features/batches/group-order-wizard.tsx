"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Package,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { createGroupOrder } from "@/server/actions/batches";
import { formatIqd } from "@/lib/format/currency";
import { validateProductImageFile } from "@/lib/upload/validate";
import type { BatchStudent, PriceCatalogItem, ProductType } from "@/types/database";
import { cn } from "@/lib/utils";

export type GroupOrderCatalogProduct = {
  id: string;
  product_type: ProductType;
  name_ar: string;
  name_en: string;
  price: number;
  image: string;
  description_ar: string | null;
  description_en: string | null;
};

type GroupOrderWizardProps = {
  batchId: string;
  batchName: string;
  students: BatchStudent[];
  prices: PriceCatalogItem[];
  catalogProducts?: GroupOrderCatalogProduct[];
  orderDetailPath?: string;
};

type Step = "products" | "review" | "details" | "confirm";

const STEPS: Step[] = ["products", "review", "details", "confirm"];

export function GroupOrderWizard({
  batchId,
  batchName,
  students,
  prices,
  catalogProducts = [],
  orderDetailPath = "/representative/orders",
}: GroupOrderWizardProps) {
  const t = useTranslations("batches");
  const productT = useTranslations("productType");
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("products");
  const [selected, setSelected] = useState<ProductType[]>(["sash", "cap"]);
  const [orderNotes, setOrderNotes] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const confirmedStudents = students.filter((student) => student.confirmed);

  const priceMap = useMemo(
    () =>
      Object.fromEntries(
        prices.map((price) => [price.product_type, Number(price.base_price)])
      ) as Record<ProductType, number>,
    [prices]
  );

  const displayProducts = useMemo(() => {
    if (catalogProducts.length > 0) return catalogProducts;
    const types: ProductType[] = ["sash", "cap", "gown", "suit", "custom"];
    return types.map((product_type) => ({
      id: product_type,
      product_type,
      name_ar: productT(product_type),
      name_en: productT(product_type),
      price: priceMap[product_type] ?? 0,
      image: "/assets/landing/product-sash.jpg",
      description_ar: null,
      description_en: null,
    }));
  }, [catalogProducts, priceMap, productT]);

  const perStudentTotal = selected.reduce(
    (sum, productType) => sum + (priceMap[productType] ?? 0),
    0
  );
  const estimatedTotal = confirmedStudents.length * perStudentTotal;
  const totalLineItems = confirmedStudents.length * selected.length;

  const toggleProduct = (productType: ProductType) => {
    setSelected((current) =>
      current.includes(productType)
        ? current.filter((value) => value !== productType)
        : [...current, productType]
    );
  };

  const handleReferenceUpload = (file: File | undefined) => {
    if (!file) return;
    const validation = validateProductImageFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setReferenceImage(reader.result);
        toast.success(isAr ? "تم رفع المرجع" : "Reference uploaded");
      }
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const order = await createGroupOrder(batchId, selected, {
        notes: orderNotes.trim() || undefined,
        referenceImageDataUrl: referenceImage ?? undefined,
      });
      toast.success(
        isAr
          ? `تم إنشاء ${order.created_count} طلب للطلاب`
          : `Created ${order.created_count} student orders`
      );
      const batchPath = orderDetailPath.includes("/admin")
        ? `/admin/batches/${batchId}`
        : `/representative/batches/${batchId}`;
      router.push(batchPath);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);
  const goNext = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]);
  const goBack = () => setStep(STEPS[Math.max(stepIndex - 1, 0)]);

  if (confirmedStudents.length === 0) {
    return (
      <WarkaCard className="py-16 text-center">
        <Users className="mx-auto mb-3 size-10 text-warka-text-muted" />
        <p className="font-medium text-warka-text">{t("noConfirmedStudents")}</p>
      </WarkaCard>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="rounded-2xl border border-warka-border bg-gradient-to-br from-warka-primary/10 via-card to-warka-bg p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-warka-primary">WARKA</p>
        <h1 className="mt-1 text-2xl font-bold text-warka-text sm:text-3xl">
          {t("groupOrderWizardTitle")}
        </h1>
        <p className="mt-1 text-sm text-warka-text-secondary">{batchName}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatChip
            icon={Users}
            label={isAr ? "طلاب مؤكّدون" : "Confirmed students"}
            value={String(confirmedStudents.length)}
          />
          <StatChip
            icon={Package}
            label={isAr ? "منتجات مختارة" : "Selected products"}
            value={String(selected.length)}
          />
          <StatChip
            icon={Check}
            label={isAr ? "إجمالي تقديري" : "Estimated total"}
            value={formatIqd(estimatedTotal, locale)}
          />
        </div>
      </div>

      <WizardSteps step={step} locale={isAr ? "ar" : "en"} />

      {step === "products" && (
        <section className="space-y-4">
          <WarkaCard>
            <WarkaCardTitle className="mb-1">{t("selectProducts")}</WarkaCardTitle>
            <p className="mb-5 text-sm text-warka-text-muted">
              {isAr
                ? "اختر المنتجات اللي تريدها للدفعة كاملة — كل طالب مؤكّد ياخذ نفس الاختيار."
                : "Pick products for the whole batch — each confirmed student gets the same selection."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {displayProducts.map((product) => {
                const active = selected.includes(product.product_type);
                const name = isAr ? product.name_ar : product.name_en;
                const desc = isAr ? product.description_ar : product.description_en;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.product_type)}
                    className={cn(
                      "group touch-manipulation overflow-hidden rounded-2xl border-2 text-start transition-all",
                      active
                        ? "border-warka-primary bg-warka-primary/5 shadow-md"
                        : "border-warka-border bg-card hover:border-warka-primary/40"
                    )}
                  >
                    <div className="relative aspect-[4/3] bg-warka-bg">
                      <Image
                        src={product.image}
                        alt={name}
                        fill
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                      {active && (
                        <span className="absolute end-3 top-3 flex size-8 items-center justify-center rounded-full bg-warka-primary text-white shadow">
                          <Check className="size-4" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 p-4">
                      <p className="font-bold text-warka-text">{name}</p>
                      <p className="text-sm font-semibold text-warka-primary">
                        {formatIqd(priceMap[product.product_type] ?? product.price, locale)}
                        <span className="font-normal text-warka-text-muted">
                          {" "}
                          / {isAr ? "طالب" : "student"}
                        </span>
                      </p>
                      {desc && (
                        <p className="line-clamp-2 text-xs text-warka-text-secondary">{desc}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </WarkaCard>
          <NavButtons
            locale={isAr ? "ar" : "en"}
            onNext={goNext}
            nextDisabled={selected.length === 0}
          />
        </section>
      )}

      {step === "review" && (
        <section className="space-y-4">
          <WarkaCard>
            <WarkaCardTitle className="mb-1">{t("reviewRoster")}</WarkaCardTitle>
            <p className="mb-4 text-sm text-warka-text-muted">
              {t("reviewSummary", {
                students: confirmedStudents.length,
                products: selected.length,
              })}{" "}
              · {totalLineItems} {isAr ? "سطر في الطلب" : "order lines"}
            </p>

            <div className="mb-5 flex flex-wrap gap-2">
              {selected.map((pt) => (
                <span
                  key={pt}
                  className="rounded-full border border-warka-primary/30 bg-warka-primary/10 px-3 py-1 text-xs font-semibold text-warka-primary"
                >
                  {productT(pt)}
                </span>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-warka-border text-warka-text-muted">
                    <th className="px-3 py-2 text-start">{t("studentName")}</th>
                    <th className="px-3 py-2 text-start">{t("size")}</th>
                    <th className="px-3 py-2 text-start">{isAr ? "الاسم للتطريز" : "Embroidery name"}</th>
                    <th className="px-3 py-2 text-start">{isAr ? "لون/قماش" : "Color / fabric"}</th>
                    <th className="px-3 py-2 text-start">{t("products")}</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedStudents.map((student) => (
                    <tr key={student.id} className="border-b border-warka-border/60">
                      <td className="px-3 py-3 font-medium text-warka-text">{student.full_name}</td>
                      <td className="px-3 py-3">{student.size ?? "—"}</td>
                      <td className="px-3 py-3" dir="rtl">
                        {student.custom_text ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-warka-text-secondary">
                        {[student.sash_color, student.fabric_type, student.cap_type]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {selected.map((pt) => productT(pt)).join("، ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {confirmedStudents.map((student) => (
                <div
                  key={student.id}
                  className="rounded-xl border border-warka-border bg-warka-bg/40 p-4 text-sm"
                >
                  <p className="font-bold text-warka-text">{student.full_name}</p>
                  <dl className="mt-2 space-y-1 text-xs text-warka-text-secondary">
                    <div className="flex justify-between gap-2">
                      <dt>{t("size")}</dt>
                      <dd>{student.size ?? "—"}</dd>
                    </div>
                    {student.custom_text && (
                      <div className="flex justify-between gap-2">
                        <dt>{isAr ? "التطريز" : "Embroidery"}</dt>
                        <dd dir="rtl">{student.custom_text}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <dt>{t("products")}</dt>
                      <dd>{selected.map((pt) => productT(pt)).join(", ")}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-warka-primary/20 bg-warka-primary/5 p-4">
              <p className="text-sm text-warka-text-secondary">
                {isAr ? "لكل طالب" : "Per student"}:{" "}
                <strong className="text-warka-text">{formatIqd(perStudentTotal, locale)}</strong>
              </p>
              <p className="mt-1 text-lg font-bold text-warka-primary">
                {t("estimatedTotal")}: {formatIqd(estimatedTotal, locale)}
              </p>
            </div>
          </WarkaCard>
          <NavButtons locale={isAr ? "ar" : "en"} onBack={goBack} onNext={goNext} />
        </section>
      )}

      {step === "details" && (
        <section className="space-y-4">
          <WarkaCard className="space-y-4">
            <div>
              <WarkaCardTitle className="mb-1">
                {isAr ? "ملاحظات ومرفقات الطلب" : "Order notes & attachments"}
              </WarkaCardTitle>
              <p className="text-sm text-warka-text-muted">
                {isAr
                  ? "اكتب أي تفاصيل للورشة — وارفع صورة مرجعية (شعار، زخرفة، لون…) إذا تحتاج."
                  : "Add workshop instructions — upload a reference image (logo, decoration, color…) if needed."}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-warka-text">
                {isAr ? "ملاحظات للورشة" : "Notes for production"}
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-warka-border bg-card px-4 py-3 text-sm text-warka-text focus:outline-none focus:ring-2 focus:ring-warka-primary/30"
                placeholder={
                  isAr
                    ? "مثال: نفس لون الشعار للكل، تسليم قبل 15/7…"
                    : "e.g. same logo color for all, deliver before 15/7…"
                }
              />
            </div>

            <div className="rounded-xl border border-dashed border-warka-primary/35 bg-warka-primary/5 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-warka-primary/40 text-warka-primary"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="size-4" />
                  {isAr ? "رفع صورة مرجعية" : "Upload reference image"}
                </Button>
                {referenceImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive"
                    onClick={() => setReferenceImage(null)}
                  >
                    <Trash2 className="size-3.5" />
                    {isAr ? "إزالة" : "Remove"}
                  </Button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleReferenceUpload(e.target.files?.[0])}
                />
              </div>
              {referenceImage ? (
                <div className="relative mt-4 aspect-video max-w-md overflow-hidden rounded-xl border border-warka-border bg-card">
                  <Image src={referenceImage} alt="" fill className="object-contain p-2" unoptimized />
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-xs text-warka-text-muted">
                  <FileImage className="size-4" />
                  {isAr ? "PNG أو JPG — اختياري" : "PNG or JPG — optional"}
                </p>
              )}
            </div>
          </WarkaCard>
          <NavButtons locale={isAr ? "ar" : "en"} onBack={goBack} onNext={goNext} />
        </section>
      )}

      {step === "confirm" && (
        <section className="space-y-4">
          <WarkaCard className="space-y-4">
            <WarkaCardTitle>{t("confirmGroupOrder")}</WarkaCardTitle>
            <ul className="space-y-3 text-sm">
              <SummaryRow
                label={isAr ? "الدفعة" : "Batch"}
                value={batchName}
              />
              <SummaryRow
                label={t("confirmStudents", { count: confirmedStudents.length }).split(":")[0] ?? ""}
                value={t("confirmStudents", { count: confirmedStudents.length })}
              />
              <SummaryRow
                label={isAr ? "المنتجات" : "Products"}
                value={selected.map((pt) => productT(pt)).join(" · ")}
              />
              <SummaryRow
                label={t("confirmTotal")}
                value={formatIqd(estimatedTotal, locale)}
                highlight
              />
              {orderNotes.trim() && (
                <SummaryRow label={isAr ? "ملاحظات" : "Notes"} value={orderNotes.trim()} />
              )}
              {referenceImage && (
                <SummaryRow
                  label={isAr ? "مرفق" : "Attachment"}
                  value={isAr ? "صورة مرجعية مرفوعة ✓" : "Reference image attached ✓"}
                />
              )}
            </ul>
          </WarkaCard>
          <NavButtons
            locale={isAr ? "ar" : "en"}
            onBack={goBack}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel={t("submitGroupOrder")}
          />
        </section>
      )}
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-warka-border/60 bg-card/80 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warka-primary/12 text-warka-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-warka-text-muted">{label}</p>
        <p className="truncate text-sm font-bold text-warka-text">{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 border-b border-warka-border/50 pb-3 last:border-0">
      <span className="text-warka-text-secondary">{label}</span>
      <span className={cn("font-medium", highlight ? "text-lg text-warka-primary" : "text-warka-text")}>
        {value}
      </span>
    </li>
  );
}

function WizardSteps({ step, locale }: { step: Step; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const labels: Record<Step, string> = {
    products: isAr ? "المنتجات" : "Products",
    review: isAr ? "مراجعة الطلاب" : "Review roster",
    details: isAr ? "ملاحظات ومرفقات" : "Notes & files",
    confirm: isAr ? "تأكيد وإرسال" : "Confirm & send",
  };

  const currentIndex = STEPS.indexOf(step);

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {STEPS.map((value, index) => {
        const done = index < currentIndex;
        const active = value === step;
        return (
          <li
            key={value}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold sm:text-sm",
              active && "border-warka-primary bg-warka-primary/10 text-warka-primary",
              done && !active && "border-warka-primary/30 bg-warka-primary/5 text-warka-text",
              !active && !done && "border-warka-border bg-card text-warka-text-muted"
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px]",
                active && "bg-warka-primary text-white",
                done && !active && "bg-warka-primary/20 text-warka-primary",
                !active && !done && "bg-warka-bg text-warka-text-muted"
              )}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className="truncate">{labels[value]}</span>
          </li>
        );
      })}
    </ol>
  );
}

function NavButtons({
  locale,
  onBack,
  onNext,
  onSubmit,
  nextDisabled,
  submitting,
  submitLabel,
}: {
  locale: "ar" | "en";
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  nextDisabled?: boolean;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const isAr = locale === "ar";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {onBack ? (
        <Button type="button" variant="outline" onClick={onBack} className="gap-1 border-warka-border">
          <ChevronRight className={cn("size-4", !isAr && "rotate-180")} />
          {isAr ? "رجوع" : "Back"}
        </Button>
      ) : (
        <span />
      )}
      {onSubmit ? (
        <Button type="button" variant="default" disabled={submitting} onClick={onSubmit}>
          {submitting ? (isAr ? "جاري الإرسال…" : "Submitting…") : submitLabel}
        </Button>
      ) : (
        <Button type="button" variant="default" disabled={nextDisabled} onClick={onNext} className="gap-1">
          {isAr ? "التالي" : "Next"}
          <ChevronLeft className={cn("size-4", !isAr && "rotate-180")} />
        </Button>
      )}
    </div>
  );
}
