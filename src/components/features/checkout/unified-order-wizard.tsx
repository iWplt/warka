"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { submitOrderWithDeposit } from "@/server/actions/orders";
import { getDepositSettings } from "@/server/actions/settings";
import {
  PaymentMethodsStep,
  type PaymentMethodId,
} from "@/components/payment/payment-methods-step";
import { DeliveryDetailsForm } from "@/components/features/delivery/delivery-details-form";
import { formatDeliveryNote, isDeliveryComplete } from "@/lib/delivery/format-delivery-note";
import { IRAQI_GOVERNORATES } from "@/lib/constants/iraq-market";
import { useDeliveryStore } from "@/stores/delivery-store";
import { formatIqd } from "@/lib/format/currency";
import {
  lineSizeIsComplete,
} from "@/lib/cart/sizes";
import { SizeSelectorField } from "@/components/features/products/size-selector-field";
import {
  getSizePolicy,
  isOneSizeProduct,
  oneSizeLabel,
  type ProductSizePolicy,
} from "@/lib/settings/size-policies";
import { calculateDeposit } from "@/lib/settings/deposit";
import type { DepositSettings, WarkaFont } from "@/lib/settings/types";
import { FontPickerTrigger } from "@/components/features/embroidery/font-picker-popup";
import { DecorationUploadField } from "@/components/features/embroidery/decoration-upload-field";
import { findFontByFamily, fontDisplayName } from "@/lib/constants/arabic-font-presets";
import { EmbroideryPositionsPicker } from "@/components/features/products/embroidery-positions-picker";
import { NameDiacriticsControls } from "@/components/features/embroidery/name-diacritics-controls";
import { EmbroideryLivePreview } from "@/components/features/embroidery/embroidery-live-preview";
import { resolveEmbroideryDisplayName, type DiacriticsMode } from "@/lib/arabic/harakat";
import { validateImageFile } from "@/lib/upload/validate";
import { useCartStore, type CartLineItem } from "@/stores/cart-store";
import { getProductCustomizationProfile } from "@/server/actions/customization";
import { ProductCustomizationEngine } from "@/components/features/customization/product-customization-engine";
import { CustomizationExtras } from "@/components/features/customization/customization-extras";
import { CustomizationVisualPreview } from "@/components/features/customization/customization-visual-preview";
import {
  primaryNameFromPayload,
  profileHasEngine,
  validateRequiredZones,
  zonesForStyle,
} from "@/lib/customization/engine";
import type { CustomizationPayload, ProductCustomizationProfile } from "@/types/customization";
import {
  clampWizardStep,
  getMaxAllowedWizardStep,
  parseStepParam,
} from "@/lib/orders/wizard-step-guard";
import {
  ORDER_WIZARD_STEPS,
  useOrderWizardStore,
  type LineEmbroideryDraft,
} from "@/stores/order-wizard-store";
import type { EmbroideryPosition, Profile } from "@/types/database";
import { cn } from "@/lib/utils";

type CatalogProductMeta = {
  id: string;
  embroidery_positions?: EmbroideryPosition[];
};

type UnifiedOrderWizardProps = {
  profile: Profile;
  fonts?: WarkaFont[];
  catalogProducts?: CatalogProductMeta[];
};

import { BACK_SHAPES, THREAD_COLORS } from "@/lib/orders/embroidery-options";

export function UnifiedOrderWizard({
  profile,
  fonts = [],
  catalogProducts = [],
}: UnifiedOrderWizardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const updateLine = useCartStore((s) => s.updateLine);
  const clearCart = useCartStore((s) => s.clearCart);

  const deliveryDetails = useDeliveryStore((s) => s.details);

  const {
    step,
    setStep,
    studentData,
    setStudentData,
    orderNotes,
    setOrderNotes,
    setEmbroideryForLine,
    getEmbroideryForLine,
    setCustomizationForLine,
    getCustomizationForLine,
    paymentMethod,
    setPaymentMethod,
    depositConfirmed,
    setDepositConfirmed,
    reset: resetWizard,
  } = useOrderWizardStore();

  const [loading, setLoading] = useState(false);
  const [activeLineId, setActiveLineId] = useState<string | null>(items[0]?.id ?? null);
  const [depositSettings, setDepositSettings] = useState<DepositSettings | null>(null);
  const [sizeGuideEntries, setSizeGuideEntries] = useState<
    Awaited<ReturnType<typeof import("@/server/actions/settings").getSizeGuideEntries>>
  >([]);
  const [sizePolicies, setSizePolicies] = useState<Record<
    import("@/types/database").ProductType,
    ProductSizePolicy
  > | null>(null);
  const [batchSizeContext, setBatchSizeContext] = useState<
    Awaited<ReturnType<typeof import("@/server/actions/settings").getSizePoliciesForStudent>> | null
  >(null);
  const [customMeasurementsByLine, setCustomMeasurementsByLine] = useState<
    Record<string, string>
  >({});
  const [profilesByProduct, setProfilesByProduct] = useState<
    Record<string, ProductCustomizationProfile | null>
  >({});

  const sashColorHex = useMemo(
    () => items.find((l) => l.productType === "sash")?.colorHex ?? null,
    [items]
  );

  const wizardHydrated = useSyncExternalStore(
    useOrderWizardStore.persist.onFinishHydration,
    () => useOrderWizardStore.persist.hasHydrated(),
    () => false
  );

  useEffect(() => {
    if (items.length === 0) {
      setStep(1);
      router.replace("/products");
    }
  }, [items.length, router, setStep]);

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
    void getDepositSettings().then(setDepositSettings);
    void import("@/server/actions/settings").then(({ getSizeGuideEntries, getSizePoliciesForStudent }) => {
      getSizeGuideEntries().then(setSizeGuideEntries);
      getSizePoliciesForStudent().then((ctx) => {
        setBatchSizeContext(ctx);
        setSizePolicies(ctx.policies);
      });
    });
  }, []);

  useEffect(() => {
    const productIds = [...new Set(items.map((line) => line.catalogProductId))];
    void Promise.all(
      productIds.map(async (id) => {
        const profile = await getProductCustomizationProfile(id);
        return [id, profile] as const;
      })
    ).then((entries) => {
      setProfilesByProduct(Object.fromEntries(entries));
    });
  }, [items]);

  useEffect(() => {
    for (const line of items) {
      if (line.customizationPayload && !getCustomizationForLine(line.id)) {
        setCustomizationForLine(line.id, line.customizationPayload);
      }
      const emb = getEmbroideryForLine(line.id);
      const patch: Partial<LineEmbroideryDraft> = {};
      if (line.decorationImageDataUrl && !emb.embroideryImageDataUrl) {
        patch.embroideryImageDataUrl = line.decorationImageDataUrl;
      }
      if (line.capSideImageDataUrl && !emb.capSideImageDataUrl) {
        patch.capSideImageDataUrl = line.capSideImageDataUrl;
      }
      if (line.capTopImageDataUrl && !emb.capTopImageDataUrl) {
        patch.capTopImageDataUrl = line.capTopImageDataUrl;
      }
      if (Object.keys(patch).length > 0) {
        setEmbroideryForLine(line.id, patch);
      }
    }
  }, [items, getCustomizationForLine, setCustomizationForLine, getEmbroideryForLine, setEmbroideryForLine]);

  useEffect(() => {
    if (!batchSizeContext?.rosterSize) return;
    const lockTypes = new Set<import("@/types/database").ProductType>(["cap", "sash"]);
    for (const line of items) {
      if (lockTypes.has(line.productType) && !line.size.trim()) {
        updateLine(line.id, { size: batchSizeContext.rosterSize, customized: true });
      }
    }
  }, [batchSizeContext, items, updateLine]);

  useEffect(() => {
    if (!sizePolicies || step !== 3) return;
    const loc = isAr ? "ar" : "en";
    for (const line of items) {
      const policy = getSizePolicy(sizePolicies, line.productType);
      if (isOneSizeProduct(policy) && !line.size.trim()) {
        updateLine(line.id, { size: oneSizeLabel(policy, loc), customized: true });
      }
    }
  }, [sizePolicies, step, items, isAr, updateLine]);

  useEffect(() => {
    if (step !== 4) return;
    const defaultName = studentData.full_name.trim();
    if (!defaultName) return;
    for (const line of items) {
      if (!line.customText.trim()) {
        updateLine(line.id, { customText: defaultName, customized: true });
      }
    }
  }, [step, studentData.full_name, items, updateLine]);

  const total = subtotal();
  const depositAmount = depositSettings ? calculateDeposit(total, depositSettings) : 0;
  const activeLine = items.find((l) => l.id === activeLineId) ?? items[0];

  const embroideryPositionsForLine = useMemo(() => {
    if (!activeLine) return [];
    const meta =
      catalogProducts.find((p) => p.id === activeLine.catalogProductId) ??
      catalogProducts.find((p) => p.id === activeLine.productType);
    return (meta?.embroidery_positions ?? []).filter((p) => p.is_active !== false);
  }, [activeLine, catalogProducts]);

  const allSized = useMemo(
    () => {
      if (!sizePolicies) return false;
      return items.every((line) =>
        lineSizeIsComplete(
          sizePolicies,
          line.productType,
          line.size,
          customMeasurementsByLine[line.id] ?? ""
        )
      );
    },
    [items, sizePolicies, customMeasurementsByLine]
  );

  useEffect(() => {
    if (!wizardHydrated) return;

    const maxAllowed = getMaxAllowedWizardStep(items, {
      hasStudentName: Boolean(studentData.full_name.trim()),
      deliveryComplete: isDeliveryComplete(deliveryDetails),
      allSized,
      depositConfirmed,
    });

    const urlStep = parseStepParam(searchParams.get("step"));
    const targetStep = urlStep ?? step;

    if (items.length === 0) {
      if (step !== 1) setStep(1);
      return;
    }

    const clamped = clampWizardStep(targetStep, maxAllowed);
    if (clamped !== step) {
      setStep(clamped);
    }
  }, [
    wizardHydrated,
    items,
    step,
    studentData.full_name,
    deliveryDetails,
    allSized,
    depositConfirmed,
    searchParams,
    setStep,
  ]);

  const mapPaymentMethod = (id: PaymentMethodId): "cash" | "bank_transfer" | "zain_cash" => {
    if (id === "cod") return "cash";
    if (id === "asia_hawala" || id === "card") return "bank_transfer";
    return "zain_cash";
  };

  const goNext = () => {
    if (step === 2) {
      if (!studentData.full_name.trim()) {
        toast.error(isAr ? "أدخل الاسم الكامل" : "Enter full name");
        return;
      }
      if (!isDeliveryComplete(deliveryDetails)) {
        toast.error(isAr ? "أكمل عنوان التوصيل بالتفصيل" : "Complete full delivery address");
        return;
      }
    }
    if (step === 3 && !allSized) {
      toast.error(isAr ? "اختر المقاس لكل منتج" : "Select size for each product");
      return;
    }
    if (step === 4) {
      for (const line of items) {
        const profile = profilesByProduct[line.catalogProductId];
        if (profileHasEngine(profile)) {
          const payload = getCustomizationForLine(line.id);
          if (!payload?.style_id && (profile?.styles.length ?? 0) > 0) {
            toast.error(
              isAr
                ? `اختر شكل المنتج: ${line.name_ar}`
                : `Choose product style: ${line.name_en}`
            );
            return;
          }
          const styleId = payload?.style_id ?? profile?.styles[0]?.id ?? null;
          const zones = zonesForStyle(profile!.zones, styleId);
          const missing = validateRequiredZones(zones, payload?.zones ?? []);
          if (missing.length) {
            toast.error(
              isAr
                ? `أكمل مناطق التطريز (${line.name_ar}): ${missing.join("، ")}`
                : `Complete embroidery zones (${line.name_en}): ${missing.join(", ")}`
            );
            return;
          }
          const nameText = payload ? primaryNameFromPayload(payload) : "";
          if (
            zones.some((z) => z.content_type === "name_major") &&
            !nameText &&
            !line.customText.trim()
          ) {
            toast.error(isAr ? "اكتب الاسم للتطريز" : "Enter embroidery name");
            return;
          }
        } else {
          if (!line.customText.trim()) {
            toast.error(isAr ? "اكتب الاسم للتطريز على كل منتج" : "Enter embroidery name for each product");
            return;
          }
        }
      }
      if (fonts.length > 0 && items.some((line) => !line.fontFamily.trim())) {
        toast.error(isAr ? "اختر خطاً لكل منتج" : "Select a font for each product");
        return;
      }
    }
    if (step === 7 && !depositConfirmed) {
      toast.error(isAr ? "أكمل دفع العربون أولاً" : "Complete deposit payment first");
      return;
    }
    setStep(Math.min(ORDER_WIZARD_STEPS.length, step + 1));
  };

  const goBack = () => setStep(Math.max(1, step - 1));

  const handleSubmit = async () => {
    if (!depositConfirmed || items.length === 0) return;
    setLoading(true);
    try {
      const deliveryNote = formatDeliveryNote(deliveryDetails, isAr ? "ar" : "en");

      const order = await submitOrderWithDeposit({
        type: "individual",
        pay_deposit: true,
        deposit_method: mapPaymentMethod(paymentMethod),
        notes: [deliveryNote, orderNotes.trim() || null].filter(Boolean).join("\n"),
        student_profile: {
          full_name: studentData.full_name.trim(),
          phone: deliveryDetails.phone.trim(),
          college: studentData.college.trim() || undefined,
          department: studentData.department.trim() || undefined,
          graduation_year: studentData.graduation_year
            ? Number(studentData.graduation_year)
            : undefined,
        },
        items: items.map((line) =>
          buildOrderItem(
            line,
            getEmbroideryForLine(line.id),
            customMeasurementsByLine[line.id] ?? "",
            getCustomizationForLine(line.id)
          )
        ),
      });

      clearCart();
      resetWizard();
      toast.success(isAr ? "تم تثبيت الطلب بنجاح" : "Order confirmed successfully");
      router.push(`/student/orders/${order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : isAr ? "حدث خطأ" : "Error");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-4xl flex-col items-center justify-center gap-3 px-4 py-16">
        <Loader2 className="size-8 animate-spin text-warka-primary" aria-hidden />
        <p className="text-sm text-warka-text-secondary">
          {isAr ? "جاري التحويل إلى المنتجات…" : "Redirecting to products…"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warka-primary">WARKA</p>
        <h1 className="mt-1 text-2xl font-bold text-warka-text">
          {isAr ? "طلب موحّد" : "Unified order"}
        </h1>
        <p className="mt-1 text-sm text-warka-text-secondary">
          {isAr
            ? "خطوة بخطوة — بياناتك محفوظة عند الرجوع للخلف"
            : "Step by step — your data is kept when you go back"}
        </p>
      </div>

      <StepIndicator step={step} locale={isAr ? "ar" : "en"} />

      {step === 1 && (
        <ProductsStep
          items={items}
          activeLineId={activeLineId}
          onSelectLine={setActiveLineId}
          locale={isAr ? "ar" : "en"}
        />
      )}

      {step === 2 && (
        <DetailsStep
          studentData={studentData}
          setStudentData={setStudentData}
          orderNotes={orderNotes}
          setOrderNotes={setOrderNotes}
          locale={isAr ? "ar" : "en"}
        />
      )}

      {step === 3 && activeLine && sizePolicies && (
        <SizesStep
          items={items}
          activeLine={activeLine}
          activeLineId={activeLineId}
          onSelectLine={setActiveLineId}
          sizeGuideEntries={sizeGuideEntries}
          sizePolicies={sizePolicies}
          batchSizeContext={batchSizeContext}
          customMeasurementsByLine={customMeasurementsByLine}
          onSize={(lineId, size) => updateLine(lineId, { size, customized: true })}
          onCustomMeasurements={(lineId, value) =>
            setCustomMeasurementsByLine((prev) => ({ ...prev, [lineId]: value }))
          }
          locale={isAr ? "ar" : "en"}
        />
      )}

      {step === 4 && activeLine && (
        <EmbroideryStep
          line={activeLine}
          draft={getEmbroideryForLine(activeLine.id)}
          customization={getCustomizationForLine(activeLine.id)}
          profile={profilesByProduct[activeLine.catalogProductId] ?? null}
          sashColorHex={sashColorHex}
          isBatchStudent={Boolean(batchSizeContext?.isBatchStudent)}
          onCustomizationChange={(payload) => {
            setCustomizationForLine(activeLine.id, payload);
            updateLine(activeLine.id, { customizationPayload: payload, customized: true });
            const nameText = primaryNameFromPayload(payload);
            if (nameText) {
              updateLine(activeLine.id, { customText: nameText, customized: true });
            }
          }}
          onChange={(patch) => setEmbroideryForLine(activeLine.id, patch)}
          onLinePatch={(patch) => updateLine(activeLine.id, { ...patch, customized: true })}
          items={items}
          activeLineId={activeLineId}
          onSelectLine={setActiveLineId}
          fonts={fonts}
          embroideryPositions={embroideryPositionsForLine}
          locale={isAr ? "ar" : "en"}
        />
      )}

      {step === 5 && activeLine && (
        <LogoStep
          line={activeLine}
          items={items}
          activeLineId={activeLineId}
          onSelectLine={setActiveLineId}
          onLogo={(lineId, file) => handleLogo(lineId, file, updateLine)}
          onClearLogo={(lineId) => updateLine(lineId, { logoDataUrl: null })}
          locale={isAr ? "ar" : "en"}
        />
      )}

      {step === 6 && (
        <ReviewStep
          items={items}
          studentData={studentData}
          total={total}
          depositAmount={depositAmount}
          getEmbroidery={getEmbroideryForLine}
          getCustomization={getCustomizationForLine}
          profilesByProduct={profilesByProduct}
          locale={isAr ? "ar" : "en"}
        />
      )}

      {step === 7 && (
        <WarkaCard className="space-y-4">
          <WarkaCardTitle>{isAr ? "دفع العربون" : "Pay deposit"}</WarkaCardTitle>
          <p className="text-sm text-warka-text-secondary">
            {isAr
              ? "الطلب يُثبّت فقط بعد دفع العربون. المبلغ المتبقي يُدفع لاحقاً."
              : "Your order is confirmed only after the deposit is paid. Balance due later."}
          </p>
          <div className="rounded-xl border border-warka-primary/20 bg-warka-primary/5 p-4">
            <p className="text-sm text-warka-text-muted">{isAr ? "العربون المطلوب" : "Required deposit"}</p>
            <p className="text-2xl font-bold text-warka-primary">{formatIqd(depositAmount, locale)}</p>
            <p className="mt-1 text-xs text-warka-text-muted">
              {isAr ? "الإجمالي:" : "Total:"} {formatIqd(total, locale)}
            </p>
          </div>
          <PaymentMethodsStep
            locale={isAr ? "ar" : "en"}
            selectedMethod={paymentMethod}
            onSelect={setPaymentMethod}
            onPaid={() => setDepositConfirmed(true)}
            total={depositAmount}
          />
          {depositConfirmed && (
            <p className="flex items-center gap-2 text-sm font-medium text-[#4CAF50]">
              <Lock className="size-4" />
              {isAr ? "تم تأكيد العربون — جاهز للإرسال" : "Deposit confirmed — ready to submit"}
            </p>
          )}
        </WarkaCard>
      )}

      {step === 8 && (
        <WarkaCard className="space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-warka-primary/10">
            <Package className="size-8 text-warka-primary" />
          </div>
          <WarkaCardTitle>{isAr ? "إرسال الطلب" : "Submit order"}</WarkaCardTitle>
          <p className="text-sm text-warka-text-secondary">
            {isAr
              ? "بعد الإرسال سيُقفل الطلب ولا يمكن تعديله إلا عبر المطبعة."
              : "After submit, the order locks and can only be changed via the print shop."}
          </p>
          <p className="text-2xl font-bold text-warka-primary">{formatIqd(total, locale)}</p>
        </WarkaCard>
      )}

      <NavButtons
        step={step}
        maxStep={ORDER_WIZARD_STEPS.length}
        loading={loading}
        onBack={goBack}
        onNext={goNext}
        onSubmit={() => void handleSubmit()}
        locale={isAr ? "ar" : "en"}
      />
    </div>
  );
}

function handleLogo(
  lineId: string,
  file: File | undefined,
  updateLine: ReturnType<typeof useCartStore.getState>["updateLine"]
) {
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
}

function buildOrderItem(
  line: CartLineItem,
  emb: LineEmbroideryDraft,
  customMeasurements: string,
  customization?: CustomizationPayload | null
) {
  const payloadName = customization ? primaryNameFromPayload(customization) : "";
  const displayName =
    payloadName ||
    resolveEmbroideryDisplayName(line.customText, line.diacriticsMode ?? "auto");
  const decorationUrl = line.decorationImageDataUrl ?? emb.embroideryImageDataUrl;
  const trimmedCustom = customMeasurements.trim();
  return {
    product_type: line.productType,
    catalog_product_id: line.catalogProductId,
    product_label: line.name_ar,
    sash_color: line.colorLabel || undefined,
    fabric_type: line.fabricKey || undefined,
    size: line.size || undefined,
    custom_text: displayName || undefined,
    font_family: line.fontFamily || undefined,
    embroidery_position: emb.embroideryPosition || line.embroideryPosition || undefined,
    back_shape: customization?.style_name_ar || emb.backShape || undefined,
    thread_color: emb.threadColor || undefined,
    embroidery_style: emb.embroideryNotes || undefined,
    custom_measurements: trimmedCustom || undefined,
    student_fields: trimmedCustom ? { custom_measurements: trimmedCustom } : undefined,
    customization_payload: customization ?? undefined,
    special_notes: [
      line.notes.trim() || null,
      line.fabricLabel ? `Fabric: ${line.fabricLabel}` : null,
      line.quantity > 1 ? `Qty: ${line.quantity}` : null,
      emb.capSideNotes ? `Cap side: ${emb.capSideNotes}` : null,
      emb.capTopNotes ? `Cap top: ${emb.capTopNotes}` : null,
    ]
      .filter(Boolean)
      .join(" | ") || undefined,
    unit_price: line.unitPrice * line.quantity,
    logo_data_url: line.logoDataUrl ?? undefined,
    embroidery_image_data_url: decorationUrl ?? undefined,
    cap_side_image_data_url: emb.capSideImageDataUrl ?? undefined,
    cap_top_image_data_url: emb.capTopImageDataUrl ?? undefined,
    cap_side_notes: emb.capSideNotes || undefined,
    cap_top_notes: emb.capTopNotes || undefined,
  };
}

function StepIndicator({ step, locale }: { step: number; locale: "ar" | "en" }) {
  return (
    <div className="mb-8 flex gap-1 overflow-x-auto pb-1">
      {ORDER_WIZARD_STEPS.map((s, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div
            key={s.en}
            className={cn(
              "flex min-w-[3.5rem] flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center",
              active && "bg-warka-primary/10"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-[10px] font-bold",
                active || done ? "bg-warka-primary text-white" : "bg-warka-bg text-warka-text-muted"
              )}
            >
              {done ? <CheckCircle2 className="size-3.5" /> : n}
            </span>
            <span className="text-[9px] font-medium leading-tight text-warka-text-secondary">
              {locale === "ar" ? s.ar : s.en}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LineTabs({
  items,
  activeLineId,
  onSelect,
  locale,
}: {
  items: CartLineItem[];
  activeLineId: string | null;
  onSelect: (id: string) => void;
  locale: "ar" | "en";
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {items.map((line) => {
        const name = locale === "ar" ? line.name_ar : line.name_en;
        return (
          <button
            key={line.id}
            type="button"
            onClick={() => onSelect(line.id)}
            className={cn(
              "shrink-0 rounded-xl border-2 px-3 py-2 text-xs font-medium",
              activeLineId === line.id
                ? "border-warka-primary bg-warka-primary/5 text-warka-primary"
                : "border-warka-border text-warka-text-secondary"
            )}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

function ProductsStep({
  items,
  activeLineId,
  onSelectLine,
  locale,
}: {
  items: CartLineItem[];
  activeLineId: string | null;
  onSelectLine: (id: string) => void;
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";
  return (
    <WarkaCard className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WarkaCardTitle>{isAr ? "منتجاتك" : "Your products"}</WarkaCardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/products">{isAr ? "إضافة منتجات" : "Add products"}</Link>
        </Button>
      </div>
      <p className="text-sm text-warka-text-secondary">
        {isAr
          ? "اختر منتجاتك من المتجر أولاً، ثم أكمل الخطوات هنا."
          : "Pick products from the store first, then complete the steps here."}
      </p>
      <LineTabs items={items} activeLineId={activeLineId} onSelect={onSelectLine} locale={locale} />
      <ul className="space-y-3">
        {items.map((line) => (
          <li
            key={line.id}
            className="flex gap-3 rounded-xl border border-warka-border p-3"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-warka-bg">
              <Image src={line.image} alt="" fill className="object-cover" sizes="64px" />
            </div>
            <div>
              <p className="font-semibold text-warka-text">
                {isAr ? line.name_ar : line.name_en}
              </p>
              <p className="text-sm text-warka-primary">{formatIqd(line.unitPrice * line.quantity, locale)}</p>
            </div>
          </li>
        ))}
      </ul>
    </WarkaCard>
  );
}

function DetailsStep({
  studentData,
  setStudentData,
  orderNotes,
  setOrderNotes,
  locale,
}: {
  studentData: ReturnType<typeof useOrderWizardStore.getState>["studentData"];
  setStudentData: ReturnType<typeof useOrderWizardStore.getState>["setStudentData"];
  orderNotes: string;
  setOrderNotes: (v: string) => void;
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";
  return (
    <div className="space-y-4">
      <WarkaCard className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>{isAr ? "الاسم الكامل *" : "Full name *"}</Label>
          <Input
            value={studentData.full_name}
            onChange={(e) => setStudentData({ full_name: e.target.value })}
            className="mt-1 border-warka-border"
          />
        </div>
        <div>
          <Label>{isAr ? "الكلية" : "College"}</Label>
          <Input
            value={studentData.college}
            onChange={(e) => setStudentData({ college: e.target.value })}
            className="mt-1 border-warka-border"
          />
        </div>
        <div>
          <Label>{isAr ? "القسم" : "Department"}</Label>
          <Input
            value={studentData.department}
            onChange={(e) => setStudentData({ department: e.target.value })}
            className="mt-1 border-warka-border"
          />
        </div>
      </WarkaCard>

      <DeliveryDetailsForm locale={locale} showEstimate />

      <WarkaCard>
        <Label>{isAr ? "ملاحظات إضافية للطلب" : "Additional order notes"}</Label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-warka-border px-3 py-2 text-sm"
          placeholder={isAr ? "أي تفاصيل إضافية للورشة أو التوصيل…" : "Any extra details for workshop or delivery…"}
        />
      </WarkaCard>
    </div>
  );
}

function SizesStep({
  items,
  activeLine,
  activeLineId,
  onSelectLine,
  sizeGuideEntries,
  sizePolicies,
  batchSizeContext,
  customMeasurementsByLine,
  onSize,
  onCustomMeasurements,
  locale,
}: {
  items: CartLineItem[];
  activeLine: CartLineItem;
  activeLineId: string | null;
  onSelectLine: (id: string) => void;
  sizeGuideEntries: Awaited<ReturnType<typeof import("@/server/actions/settings").getSizeGuideEntries>>;
  sizePolicies: Record<import("@/types/database").ProductType, ProductSizePolicy>;
  batchSizeContext: Awaited<
    ReturnType<typeof import("@/server/actions/settings").getSizePoliciesForStudent>
  > | null;
  customMeasurementsByLine: Record<string, string>;
  onSize: (lineId: string, size: string) => void;
  onCustomMeasurements: (lineId: string, value: string) => void;
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";
  const rosterLockedTypes = new Set<import("@/types/database").ProductType>(["cap", "sash"]);
  const sizeLocked =
    Boolean(batchSizeContext?.isBatchStudent) &&
    Boolean(batchSizeContext?.rosterSize) &&
    rosterLockedTypes.has(activeLine.productType);
  const lockedValue =
    sizeLocked && batchSizeContext?.rosterSize
      ? batchSizeContext.rosterSize
      : activeLine.size;

  return (
    <div className="space-y-4">
      {batchSizeContext?.isBatchStudent && batchSizeContext.batchName && (
        <div className="flex items-start gap-2 rounded-xl border border-warka-primary/30 bg-warka-primary/5 px-4 py-3 text-sm text-warka-text">
          <Lock className="mt-0.5 size-4 shrink-0 text-warka-primary" />
          <p>
            {isAr
              ? `أنت مسجّل في دفعة «${batchSizeContext.batchName}» — المقاسات تُحدَّد حسب إعدادات الممثل أو الإدارة.`
              : `You are in batch "${batchSizeContext.batchName}" — sizes follow rep or admin batch settings.`}
          </p>
        </div>
      )}
      <LineTabs items={items} activeLineId={activeLineId} onSelect={onSelectLine} locale={locale} />
      <SizeSelectorField
        productType={activeLine.productType}
        policies={sizePolicies}
        sizeGuideEntries={sizeGuideEntries}
        size={activeLine.size}
        customMeasurements={customMeasurementsByLine[activeLine.id] ?? ""}
        onSizeChange={(size) => onSize(activeLine.id, size)}
        onCustomMeasurementsChange={(value) => onCustomMeasurements(activeLine.id, value)}
        locale={locale}
        locked={sizeLocked}
        lockedValue={lockedValue}
      />
    </div>
  );
}

function EmbroideryStep({
  line,
  draft,
  customization,
  profile,
  sashColorHex,
  isBatchStudent,
  onCustomizationChange,
  onChange,
  onLinePatch,
  items,
  activeLineId,
  onSelectLine,
  fonts,
  embroideryPositions,
  locale,
}: {
  line: CartLineItem;
  draft: LineEmbroideryDraft;
  customization: CustomizationPayload | null;
  profile: ProductCustomizationProfile | null;
  sashColorHex: string | null;
  isBatchStudent: boolean;
  onCustomizationChange: (payload: CustomizationPayload) => void;
  onChange: (patch: Partial<LineEmbroideryDraft>) => void;
  onLinePatch: (
    patch: Partial<
      Pick<
        CartLineItem,
        "customText" | "fontFamily" | "embroideryPosition" | "diacriticsMode" | "decorationImageDataUrl"
      >
    >
  ) => void;
  items: CartLineItem[];
  activeLineId: string | null;
  onSelectLine: (id: string) => void;
  fonts: WarkaFont[];
  embroideryPositions: EmbroideryPosition[];
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";
  const usesEngine = profileHasEngine(profile);
  const engineValue: CustomizationPayload = customization ?? {
    style_id: profile?.styles[0]?.id ?? null,
    zones: [],
  };
  const hasNameZone = profile?.zones.some((z) => z.content_type === "name_major") ?? false;
  const activeStyleKey = profile?.styles.find((s) => s.id === engineValue.style_id)?.style_key;
  const decorationUrl = line.decorationImageDataUrl ?? draft.embroideryImageDataUrl;

  const syncDecoration = (dataUrl: string | null) => {
    onChange({ embroideryImageDataUrl: dataUrl });
    onLinePatch({ decorationImageDataUrl: dataUrl });
  };

  if (usesEngine && profile) {
    return (
      <div className="space-y-4">
        <WarkaCard className="space-y-4">
          <LineTabs items={items} activeLineId={activeLineId} onSelect={onSelectLine} locale={locale} />
        </WarkaCard>

        <ProductCustomizationEngine
          profile={profile}
          locale={locale}
          value={engineValue}
          onChange={onCustomizationChange}
          sashColorHex={sashColorHex}
          fontFamily={line.fontFamily || "Cairo, sans-serif"}
          isBatchStudent={isBatchStudent}
        />

        <CustomizationVisualPreview
          baseImage={line.image}
          productType={line.productType}
          profile={profile}
          customization={engineValue}
          sashColorHex={sashColorHex ?? line.colorHex}
          fontFamily={line.fontFamily || "Cairo, sans-serif"}
          locale={locale}
        />

        <CustomizationExtras
          locale={locale}
          productType={line.productType}
          decorationUrl={decorationUrl}
          onDecorationChange={syncDecoration}
          capSideUrl={draft.capSideImageDataUrl}
          capTopUrl={draft.capTopImageDataUrl}
          onCapSideChange={(url) => onChange({ capSideImageDataUrl: url })}
          onCapTopChange={(url) => onChange({ capTopImageDataUrl: url })}
          showCustomReference={activeStyleKey === "custom_image"}
          customReferenceUrl={draft.embroideryImageDataUrl}
          onCustomReferenceChange={syncDecoration}
        />

        {hasNameZone && fonts.length > 0 && (
          <WarkaCard className="space-y-2">
            <FontPickerTrigger
              fonts={fonts}
              previewText={resolveEmbroideryDisplayName(line.customText, line.diacriticsMode ?? "auto")}
              selectedFontFamily={line.fontFamily || null}
              onConfirm={(fontFamilyCss) => onLinePatch({ fontFamily: fontFamilyCss })}
              locale={locale}
              required
            />
          </WarkaCard>
        )}
      </div>
    );
  }

  const isCap = line.productType === "cap";
  const displayName = resolveEmbroideryDisplayName(line.customText, line.diacriticsMode ?? "auto");

  const uploadImage = (field: keyof LineEmbroideryDraft, file: File | undefined) => {
    if (!file) return;
    const v = validateImageFile(file);
    if (!v.ok) {
      toast.error(v.error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (field === "embroideryImageDataUrl") {
          syncDecoration(reader.result);
        } else {
          onChange({ [field]: reader.result });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <WarkaCard className="space-y-4">
        <LineTabs items={items} activeLineId={activeLineId} onSelect={onSelectLine} locale={locale} />

        <NameDiacriticsControls
          baseName={line.customText}
          mode={line.diacriticsMode ?? "auto"}
          onBaseNameChange={(value) => onLinePatch({ customText: value })}
          onModeChange={(mode) => onLinePatch({ diacriticsMode: mode })}
          locale={locale}
        />

        <DecorationUploadField
          imageUrl={decorationUrl}
          onChange={syncDecoration}
          locale={locale}
        />

        {fonts.length > 0 && (
          <div className="space-y-2">
            <FontPickerTrigger
              fonts={fonts}
              previewText={displayName}
              selectedFontFamily={line.fontFamily || null}
              onConfirm={(fontFamilyCss) => onLinePatch({ fontFamily: fontFamilyCss })}
              locale={locale}
              required
            />
            {line.fontFamily && (
              <p className="text-center text-xs text-warka-text-muted">
                {isAr ? "الخط المختار:" : "Selected:"}{" "}
                {fontDisplayName(findFontByFamily(fonts, line.fontFamily)!, locale)}
              </p>
            )}
          </div>
        )}

        <EmbroideryLivePreview
          baseName={line.customText}
          diacriticsMode={line.diacriticsMode ?? "auto"}
          fontFamily={line.fontFamily}
          fonts={fonts}
          locale={locale}
          embedded
        />

        {embroideryPositions.length > 0 && (
          <EmbroideryPositionsPicker
            positions={embroideryPositions}
            selectedKey={line.embroideryPosition}
            onChange={(key) => onLinePatch({ embroideryPosition: key })}
            locale={locale}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        )}
      </WarkaCard>

      <WarkaCard className="space-y-4">
        <WarkaCardTitle>{isAr ? "تفاصيل التطريز" : "Embroidery details"}</WarkaCardTitle>
        <div>
          <Label>{isAr ? "شكل الظهر" : "Back shape"}</Label>
          <div className="mt-2 flex flex-wrap gap-2">
          {BACK_SHAPES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange({ backShape: s.key })}
              className={cn(
                "rounded-lg border-2 px-3 py-1.5 text-xs font-medium",
                draft.backShape === s.key
                  ? "border-warka-primary bg-warka-primary/10"
                  : "border-warka-border"
              )}
            >
              {isAr ? s.ar : s.en}
            </button>
          ))}
          </div>
        </div>
      <div>
        <Label>{isAr ? "لون الخيط" : "Thread color"}</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {THREAD_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onChange({ threadColor: c.key })}
              className={cn(
                "flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-xs",
                draft.threadColor === c.key ? "border-warka-primary" : "border-warka-border"
              )}
            >
              <span className="size-4 rounded-full border" style={{ backgroundColor: c.hex }} />
              {isAr ? c.ar : c.en}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>{isAr ? "ملاحظات التطريز" : "Embroidery notes"}</Label>
        <textarea
          value={draft.embroideryNotes}
          onChange={(e) => onChange({ embroideryNotes: e.target.value })}
          rows={2}
          className="mt-1 w-full rounded-xl border border-warka-border px-3 py-2 text-sm"
        />
      </div>
      {isCap && (
        <>
          <div className="border-t border-warka-border pt-4">
            <p className="mb-2 text-sm font-semibold">
              {isAr ? "تطريز جانبي (اختياري)" : "Side embroidery (optional)"}
            </p>
            <input
              type="file"
              accept="image/*"
              className="mb-2 block w-full text-sm"
              onChange={(e) => uploadImage("capSideImageDataUrl", e.target.files?.[0])}
            />
            <textarea
              value={draft.capSideNotes}
              onChange={(e) => onChange({ capSideNotes: e.target.value })}
              rows={2}
              placeholder={isAr ? "ملاحظات" : "Notes"}
              className="w-full rounded-xl border border-warka-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">
              {isAr ? "تطريز علوي (اختياري)" : "Top embroidery (optional)"}
            </p>
            <input
              type="file"
              accept="image/*"
              className="mb-2 block w-full text-sm"
              onChange={(e) => uploadImage("capTopImageDataUrl", e.target.files?.[0])}
            />
            <textarea
              value={draft.capTopNotes}
              onChange={(e) => onChange({ capTopNotes: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-warka-border px-3 py-2 text-sm"
            />
          </div>
        </>
      )}
      </WarkaCard>
    </div>
  );
}

function LogoStep({
  line,
  items,
  activeLineId,
  onSelectLine,
  onLogo,
  onClearLogo,
  locale,
}: {
  line: CartLineItem;
  items: CartLineItem[];
  activeLineId: string | null;
  onSelectLine: (id: string) => void;
  onLogo: (lineId: string, file: File | undefined) => void;
  onClearLogo: (lineId: string) => void;
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";
  return (
    <WarkaCard className="space-y-4">
      <LineTabs items={items} activeLineId={activeLineId} onSelect={onSelectLine} locale={locale} />
      <Label>{isAr ? "رفع الشعار" : "Upload logo"}</Label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onLogo(line.id, e.target.files?.[0])}
        className="block w-full text-sm"
      />
      {line.logoDataUrl && (
        <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-xl border border-warka-border">
          <Image src={line.logoDataUrl} alt="" fill className="object-contain" sizes="160px" />
        </div>
      )}
      {line.logoDataUrl && (
        <button
          type="button"
          onClick={() => onClearLogo(line.id)}
          className="text-sm text-destructive"
        >
          {isAr ? "إزالة الشعار" : "Remove logo"}
        </button>
      )}
    </WarkaCard>
  );
}

function ReviewStep({
  items,
  studentData,
  total,
  depositAmount,
  getEmbroidery,
  getCustomization,
  profilesByProduct,
  locale,
}: {
  items: CartLineItem[];
  studentData: ReturnType<typeof useOrderWizardStore.getState>["studentData"];
  total: number;
  depositAmount: number;
  getEmbroidery: (id: string) => LineEmbroideryDraft;
  getCustomization: (id: string) => CustomizationPayload | null;
  profilesByProduct: Record<string, ProductCustomizationProfile | null>;
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";
  const deliveryDetails = useDeliveryStore((s) => s.details);
  const gov = IRAQI_GOVERNORATES.find((g) => g.en === deliveryDetails.governorate);
  const govLabel = isAr ? gov?.ar : gov?.en;

  return (
    <WarkaCard className="space-y-4">
      <WarkaCardTitle>{isAr ? "مراجعة الطلب" : "Review order"}</WarkaCardTitle>
      <p className="text-sm">
        <strong>{studentData.full_name}</strong>
        {deliveryDetails.area && (
          <>
            {" "}
            — {deliveryDetails.area}
            {govLabel ? `, ${govLabel}` : ""}
          </>
        )}
      </p>
      {items.map((line) => {
        const emb = getEmbroidery(line.id);
        const customization = getCustomization(line.id);
        const profile = profilesByProduct[line.catalogProductId];
        return (
          <div key={line.id} className="rounded-xl border border-warka-border p-3 text-sm">
            <p className="font-semibold">{isAr ? line.name_ar : line.name_en}</p>
            {customization?.style_name_ar && (
              <p>
                {isAr ? "الشكل:" : "Style:"} {customization.style_name_ar}
              </p>
            )}
            {customization?.zones.map((zone) => (
              <p key={zone.zone_id}>
                {zone.zone_label_ar ?? zone.zone_key}:{" "}
                {zone.text_value || (zone.computed_size_mm ? `${zone.computed_size_mm} mm` : "—")}
              </p>
            ))}
            {!profileHasEngine(profile) && line.customText && (
              <p>
                {isAr ? "الاسم:" : "Name:"}{" "}
                <span style={{ fontFamily: line.fontFamily ? `"${line.fontFamily}", serif` : undefined }}>
                  {resolveEmbroideryDisplayName(line.customText, line.diacriticsMode ?? "auto")}
                </span>
              </p>
            )}
            {line.diacriticsMode === "auto" && line.customText && (
              <p className="text-xs text-muted-foreground">
                {isAr ? "الحركات: WARKA" : "Harakat: added by WARKA"}
              </p>
            )}
            {(line.decorationImageDataUrl || emb.embroideryImageDataUrl) && (
              <p>{isAr ? "✓ زخرفة مرفوعة" : "✓ Decoration uploaded"}</p>
            )}
            {line.fontFamily && (
              <p>
                {isAr ? "الخط:" : "Font:"} {line.fontFamily}
              </p>
            )}
            {line.embroideryPosition && (
              <p>
                {isAr ? "مكان التطريز:" : "Placement:"} {line.embroideryPosition}
              </p>
            )}
            {line.size && <p>{isAr ? "المقاس:" : "Size:"} {line.size}</p>}
            {emb.threadColor && <p>{isAr ? "الخيط:" : "Thread:"} {emb.threadColor}</p>}
          </div>
        );
      })}
      <div className="border-t border-warka-border pt-3 space-y-1">
        <div className="flex justify-between font-bold">
          <span>{isAr ? "الإجمالي" : "Total"}</span>
          <span>{formatIqd(total, locale)}</span>
        </div>
        <div className="flex justify-between text-warka-primary">
          <span>{isAr ? "العربون" : "Deposit"}</span>
          <span>{formatIqd(depositAmount, locale)}</span>
        </div>
      </div>
    </WarkaCard>
  );
}

function NavButtons({
  step,
  maxStep,
  loading,
  onBack,
  onNext,
  onSubmit,
  locale,
}: {
  step: number;
  maxStep: number;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";
  return (
    <div className="mt-8 flex justify-between gap-3">
      <button
        type="button"
        disabled={step <= 1}
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-warka-border px-4 py-2.5 text-sm font-medium disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
        {isAr ? "رجوع" : "Back"}
      </button>
      {step < maxStep ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-warka-primary px-6 py-2.5 text-sm font-semibold text-white"
        >
          {isAr ? "التالي" : "Next"}
          <ChevronRight className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-warka-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? (isAr ? "جاري الإرسال…" : "Submitting…") : isAr ? "إرسال الطلب" : "Submit order"}
        </button>
      )}
    </div>
  );
}
