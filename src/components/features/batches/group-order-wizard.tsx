"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createGroupOrder } from "@/server/actions/batches";
import { formatIqd } from "@/lib/format/currency";
import type { BatchStudent, PriceCatalogItem, ProductType } from "@/types/database";

const PRODUCT_TYPES: ProductType[] = ["sash", "cap", "gown", "suit", "custom"];

type GroupOrderWizardProps = {
  batchId: string;
  batchName: string;
  students: BatchStudent[];
  prices: PriceCatalogItem[];
};

type Step = "products" | "review" | "confirm";

export function GroupOrderWizard({
  batchId,
  batchName,
  students,
  prices,
}: GroupOrderWizardProps) {
  const t = useTranslations("batches");
  const productT = useTranslations("productType");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>("products");
  const [selected, setSelected] = useState<ProductType[]>(["sash", "cap"]);
  const [submitting, setSubmitting] = useState(false);

  const confirmedStudents = students.filter((student) => student.confirmed);

  const priceMap = useMemo(
    () =>
      Object.fromEntries(
        prices.map((price) => [price.product_type, Number(price.base_price)])
      ) as Record<ProductType, number>,
    [prices]
  );

  const estimatedTotal =
    confirmedStudents.length *
    selected.reduce((sum, productType) => sum + (priceMap[productType] ?? 0), 0);

  const toggleProduct = (productType: ProductType) => {
    setSelected((current) =>
      current.includes(productType)
        ? current.filter((value) => value !== productType)
        : [...current, productType]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const order = await createGroupOrder(batchId, selected);
      toast.success(t("groupOrderCreated"));
      router.push(`/representative/orders/${order.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedStudents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-glass-border glass p-10 text-center">
        <p className="text-muted-foreground">{t("noConfirmedStudents")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">{t("groupOrderWizardTitle")}</h1>
        <p className="text-muted-foreground">{batchName}</p>
      </div>

      <WizardSteps step={step} />

      {step === "products" && (
        <section className="rounded-2xl border border-glass-border glass p-6">
          <h2 className="mb-4 font-semibold">{t("selectProducts")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRODUCT_TYPES.map((productType) => {
              const active = selected.includes(productType);
              return (
                <button
                  key={productType}
                  type="button"
                  onClick={() => toggleProduct(productType)}
                  className={`rounded-xl border p-4 text-start transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-glass-border bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className="font-medium">{productT(productType)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatIqd(priceMap[productType] ?? 0, locale)}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              variant="accent"
              disabled={selected.length === 0}
              onClick={() => setStep("review")}
            >
              {t("nextStep")}
            </Button>
          </div>
        </section>
      )}

      {step === "review" && (
        <section className="rounded-2xl border border-glass-border glass p-6">
          <h2 className="mb-4 font-semibold">{t("reviewRoster")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("reviewSummary", {
              students: confirmedStudents.length,
              products: selected.length,
            })}
          </p>
          <div className="mb-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-glass-border text-muted-foreground">
                  <th className="px-3 py-2 text-start">{t("studentName")}</th>
                  <th className="px-3 py-2 text-start">{t("size")}</th>
                  <th className="px-3 py-2 text-start">{t("products")}</th>
                </tr>
              </thead>
              <tbody>
                {confirmedStudents.map((student) => (
                  <tr key={student.id} className="border-b border-glass-border/60">
                    <td className="px-3 py-3">{student.full_name}</td>
                    <td className="px-3 py-3">{student.size ?? "—"}</td>
                    <td className="px-3 py-3">
                      {selected.map((productType) => productT(productType)).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-lg font-semibold text-accent">
            {t("estimatedTotal")}: {formatIqd(estimatedTotal, locale)}
          </p>
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep("products")}>
              {t("back")}
            </Button>
            <Button variant="accent" onClick={() => setStep("confirm")}>
              {t("nextStep")}
            </Button>
          </div>
        </section>
      )}

      {step === "confirm" && (
        <section className="rounded-2xl border border-glass-border glass p-6">
          <h2 className="mb-4 font-semibold">{t("confirmGroupOrder")}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{t("confirmStudents", { count: confirmedStudents.length })}</li>
            <li>
              {t("confirmProducts", {
                products: selected.map((productType) => productT(productType)).join(", "),
              })}
            </li>
            <li>
              {t("confirmTotal")}: {formatIqd(estimatedTotal, locale)}
            </li>
          </ul>
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep("review")}>
              {t("back")}
            </Button>
            <Button variant="accent" disabled={submitting} onClick={handleSubmit}>
              {submitting ? t("loading") : t("submitGroupOrder")}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function WizardSteps({ step }: { step: Step }) {
  const t = useTranslations("batches");
  const steps: Step[] = ["products", "review", "confirm"];
  const labels = [t("stepProducts"), t("stepReview"), t("stepConfirm")];

  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((value, index) => (
        <li
          key={value}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            step === value ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground"
          }`}
        >
          {index + 1}. {labels[index]}
        </li>
      ))}
    </ol>
  );
}