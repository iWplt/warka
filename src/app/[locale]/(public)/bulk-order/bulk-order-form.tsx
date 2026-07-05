"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Info, MessageCircle, Ruler, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WarkaCard } from "@/components/ui/warka-card";
import { SizeGuide } from "@/components/ux/size-guide";
import { IRAQI_UNIVERSITIES, buildWhatsAppUrl } from "@/lib/constants/iraq-market";
import { GRADUATION_PRODUCT_META } from "@/lib/constants/graduation-products";
import { getSizeOptions } from "@/lib/cart/sizes";
import { createBulkLead, type BulkLeadInput } from "@/server/actions/leads";
import type { Product, ProductType } from "@/types/database";
import { cn } from "@/lib/utils";

type BulkOrderFormProps = {
  products: Product[];
};

type BulkProductLine = {
  id: string;
  productType: ProductType;
  nameAr: string;
  nameEn: string;
  selected: boolean;
  sizeQty: Record<string, string>;
};

const PRODUCT_LABELS: Record<ProductType, { ar: string; en: string }> = {
  sash: { ar: "وشاح تخرج", en: "Graduation sash" },
  cap: { ar: "قبعة تخرج", en: "Graduation cap" },
  gown: { ar: "روب تخرج", en: "Graduation gown" },
  suit: { ar: "بدلة تخرج", en: "Graduation suit" },
  custom: { ar: "طلب مخصص", en: "Custom order" },
};

const fieldClass =
  "warka-input mt-1.5 w-full";

function buildProductLines(catalog: Product[]): BulkProductLine[] {
  const byType = new Map<ProductType, Product>();
  for (const p of catalog.filter((x) => x.active)) {
    if (!byType.has(p.product_type)) byType.set(p.product_type, p);
  }

  return GRADUATION_PRODUCT_META.map((meta) => {
    const fromCatalog = byType.get(meta.productType);
    const labels = PRODUCT_LABELS[meta.productType];
    const sizes = getSizeOptions(meta.productType, "ar");
    const sizeQty = Object.fromEntries(sizes.map((s) => [s, ""]));

    return {
      id: fromCatalog?.id ?? meta.productType,
      productType: meta.productType,
      nameAr: fromCatalog?.name_ar ?? labels.ar,
      nameEn: fromCatalog?.name_en ?? labels.en,
      selected: false,
      sizeQty,
    };
  });
}

type FormState = {
  university: string;
  student_count: string;
  coordinator_name: string;
  phone: string;
  email: string;
  delivery_date: string;
  notes: string;
  lines: BulkProductLine[];
};

function createInitialForm(products: Product[]): FormState {
  return {
    university: "",
    student_count: "",
    coordinator_name: "",
    phone: "",
    email: "",
    delivery_date: "",
    notes: "",
    lines: buildProductLines(products),
  };
}

function lineTotal(line: BulkProductLine): number {
  return Object.values(line.sizeQty).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

export function BulkOrderForm({ products }: BulkOrderFormProps) {
  const locale = useLocale() as "ar" | "en";
  const isAr = locale === "ar";
  const [form, setForm] = useState<FormState>(() => createInitialForm(products));
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectedLines = useMemo(
    () => form.lines.filter((l) => l.selected),
    [form.lines]
  );

  const updateField = <K extends keyof Omit<FormState, "lines">>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleLine = (id: string) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === id ? { ...line, selected: !line.selected } : line
      ),
    }));
  };

  const updateSizeQty = (lineId: string, size: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === lineId
          ? { ...line, sizeQty: { ...line.sizeQty, [size]: value } }
          : line
      ),
    }));
  };

  const formatSizeBreakdown = (line: BulkProductLine) => {
    const parts = Object.entries(line.sizeQty)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([size, qty]) => `${size}: ${qty}`);
    return parts.length > 0 ? parts.join(", ") : isAr ? "لم يُحدد" : "Not specified";
  };

  const buildWhatsAppMessage = () => {
    const productBlocks = selectedLines
      .map((line) => {
        const name = isAr ? line.nameAr : line.nameEn;
        return `- ${name}\n  ${isAr ? "المقاسات" : "Sizes"}: ${formatSizeBreakdown(line)}`;
      })
      .join("\n");

    return isAr
      ? `مرحباً WARKA، أريد طلباً جماعياً:\n\nالجامعة: ${form.university}\nعدد الطلاب: ${form.student_count}\nالمنسق: ${form.coordinator_name}\nالهاتف: ${form.phone}${form.email ? `\nالبريد: ${form.email}` : ""}${form.delivery_date ? `\nموعد التسليم: ${form.delivery_date}` : ""}\n\nالمنتجات والمقاسات:\n${productBlocks || "—"}${form.notes ? `\n\nملاحظات: ${form.notes}` : ""}`
      : `Hello WARKA, bulk order request:\n\nUniversity: ${form.university}\nStudents: ${form.student_count}\nCoordinator: ${form.coordinator_name}\nPhone: ${form.phone}${form.email ? `\nEmail: ${form.email}` : ""}${form.delivery_date ? `\nDelivery: ${form.delivery_date}` : ""}\n\nProducts & sizes:\n${productBlocks || "—"}${form.notes ? `\n\nNotes: ${form.notes}` : ""}`;
  };

  const validate = (): boolean => {
    if (!form.university || !form.student_count || !form.coordinator_name || !form.phone) {
      toast.error(isAr ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields");
      return false;
    }

    if (selectedLines.length === 0) {
      toast.error(isAr ? "اختر منتجاً واحداً على الأقل" : "Select at least one product");
      return false;
    }

    for (const line of selectedLines) {
      if (lineTotal(line) <= 0) {
        const name = isAr ? line.nameAr : line.nameEn;
        toast.error(
          isAr
            ? `حدّد كميات المقاسات لـ «${name}»`
            : `Enter size quantities for "${name}"`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: BulkLeadInput = {
      university: form.university,
      student_count: Number(form.student_count),
      coordinator_name: form.coordinator_name,
      phone: form.phone,
      email: form.email,
      notes: [form.delivery_date ? `${isAr ? "موعد التسليم" : "Delivery"}: ${form.delivery_date}` : null, form.notes]
        .filter(Boolean)
        .join("\n"),
      products: selectedLines.map((line) => {
        const sizes: Record<string, number> = {};
        for (const [size, qty] of Object.entries(line.sizeQty)) {
          const n = Number(qty);
          if (n > 0) sizes[size] = n;
        }
        return {
          id: line.id,
          name: isAr ? line.nameAr : line.nameEn,
          product_type: line.productType,
          quantity: lineTotal(line),
          sizes,
        };
      }),
    };

    startTransition(async () => {
      try {
        await createBulkLead(payload);
        toast.success(
          isAr ? "تم استلام طلبك — سنتواصل خلال ٢٤ ساعة" : "Request received — we will contact you within 24h"
        );
        setForm(createInitialForm(products));
      } catch {
        toast.error(isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again");
      }
    });
  };

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      lines: buildProductLines(products).map((line) => {
        const existing = prev.lines.find((l) => l.productType === line.productType);
        return existing ? { ...line, selected: existing.selected, sizeQty: existing.sizeQty } : line;
      }),
    }));
  }, [products]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <WarkaCard className="border-warka-border p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-sm font-semibold text-warka-text">
              {isAr ? "الجامعة *" : "University *"}
            </Label>
            <select
              required
              value={form.university}
              onChange={(e) => updateField("university", e.target.value)}
              className={fieldClass}
            >
              <option value="">{isAr ? "اختر الجامعة" : "Select university"}</option>
              {IRAQI_UNIVERSITIES.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-semibold text-warka-text">
                {isAr ? "عدد الطلاب *" : "Student count *"}
              </Label>
              <input
                type="number"
                min={1}
                required
                value={form.student_count}
                onChange={(e) => updateField("student_count", e.target.value)}
                placeholder={isAr ? "مثال: 120" : "e.g. 120"}
                className={fieldClass}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-warka-text">
                {isAr ? "اسم المنسق *" : "Coordinator name *"}
              </Label>
              <input
                required
                value={form.coordinator_name}
                onChange={(e) => updateField("coordinator_name", e.target.value)}
                placeholder={isAr ? "الاسم الكامل" : "Full name"}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-semibold text-warka-text">
                {isAr ? "رقم الموبايل *" : "Mobile *"}
              </Label>
              <input
                type="tel"
                required
                dir="ltr"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="07XX XXX XXXX"
                className={cn(fieldClass, "text-left")}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-warka-text">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </Label>
              <input
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="name@university.edu.iq"
                className={cn(fieldClass, "text-left")}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-warka-text">
              {isAr ? "موعد التسليم المطلوب (ميلادي)" : "Preferred delivery (Gregorian)"}
            </Label>
            <input
              type="date"
              value={form.delivery_date}
              onChange={(e) => updateField("delivery_date", e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-sm font-semibold text-warka-text">
                {isAr ? "المنتجات والمقاسات *" : "Products & sizes *"}
              </Label>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-warka-primary hover:underline"
              >
                <Ruler className="size-3.5" />
                {isAr ? "دليل المقاسات" : "Size guide"}
              </button>
            </div>
            <p className="text-xs text-warka-text-muted">
              {isAr
                ? "اختر المنتجات ثم حدّد عدد الطلاب لكل مقاس (مجموع المقاسات = عدد القطع المطلوبة)."
                : "Select products, then enter student count per size."}
            </p>

            <div className="space-y-3">
              {form.lines.map((line) => {
                const name = isAr ? line.nameAr : line.nameEn;
                const sizes = getSizeOptions(line.productType, isAr ? "ar" : "en");
                const total = lineTotal(line);

                return (
                  <div
                    key={line.id}
                    className={cn(
                      "rounded-xl border p-4 transition-colors",
                      line.selected
                        ? "border-warka-primary bg-warka-primary/5"
                        : "border-warka-border bg-card"
                    )}
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={line.selected}
                        onChange={() => toggleLine(line.id)}
                        className="size-4 accent-warka-primary"
                      />
                      <span className="font-semibold text-warka-text">{name}</span>
                      {line.selected && total > 0 && (
                        <span className="ms-auto text-xs font-medium text-warka-primary">
                          {isAr ? `المجموع: ${total}` : `Total: ${total}`}
                        </span>
                      )}
                    </label>

                    {line.selected && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                        {sizes.map((size) => (
                          <div key={size}>
                            <label className="mb-1 block text-xs font-medium text-warka-text-secondary">
                              {size}
                            </label>
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={line.sizeQty[size] ?? ""}
                              onChange={(e) => updateSizeQty(line.id, size, e.target.value)}
                              placeholder="0"
                              className="warka-input h-9 px-2 text-center text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-warka-text">
              {isAr ? "ملاحظات إضافية" : "Additional notes"}
            </Label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder={
                isAr
                  ? "ألوان الكلية، شعار الجامعة، متطلبات خاصة..."
                  : "College colors, university logo, special requirements..."
              }
              className={cn(fieldClass, "resize-y")}
            />
          </div>

          <WarkaCard className="flex gap-3 border-warka-accent/30 bg-warka-accent/10 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-warka-primary" />
            <p className="text-sm text-warka-text-secondary">
              {isAr
                ? "سنتواصل معك خلال ٢٤ ساعة بعرض مخصّص يشمل الأسعار والجدول الزمني."
                : "We will contact you within 24 hours with a custom quote and timeline."}
            </p>
          </WarkaCard>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={pending} className="min-h-[44px] gap-2 bg-warka-primary hover:bg-warka-primary-dark">
              <Send className="size-4" />
              {pending
                ? isAr
                  ? "جاري الإرسال..."
                  : "Sending..."
                : isAr
                  ? "إرسال الطلب"
                  : "Submit request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] gap-2 border-[#25D366] bg-card text-[#128C7E] hover:bg-[#25D366]/10"
              asChild
            >
              <a href={buildWhatsAppUrl(buildWhatsAppMessage())} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                {isAr ? "أرسل عبر واتساب مباشرة" : "Send via WhatsApp"}
              </a>
            </Button>
          </div>
        </form>
      </WarkaCard>

      <aside className="space-y-4">
        <WarkaCard className="border-warka-border bg-warka-bg p-5">
          <h3 className="mb-2 text-base font-bold text-warka-text">
            {isAr ? "لماذا الطلب الجماعي؟" : "Why bulk order?"}
          </h3>
          <ul className="space-y-2 text-sm text-warka-text-secondary">
            <li>{isAr ? "• أسعار مخفّضة للمجموعات" : "• Discounted group pricing"}</li>
            <li>{isAr ? "• تنسيق موحّد للكلية" : "• Unified college branding"}</li>
            <li>{isAr ? "• مدير حساب مخصص" : "• Dedicated account manager"}</li>
            <li>{isAr ? "• توصيل لجميع المحافظات" : "• Delivery across Iraq"}</li>
          </ul>
        </WarkaCard>
      </aside>

      <SizeGuide open={sizeGuideOpen} onOpenChange={setSizeGuideOpen} locale={isAr ? "ar" : "en"} />
    </div>
  );
}
