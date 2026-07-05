"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { FontPickerTrigger } from "@/components/features/embroidery/font-picker-popup";
import { DecorationUploadField } from "@/components/features/embroidery/decoration-upload-field";
import { NameDiacriticsControls } from "@/components/features/embroidery/name-diacritics-controls";
import { EmbroideryLivePreview } from "@/components/features/embroidery/embroidery-live-preview";
import { EmbroideryPositionsPicker } from "@/components/features/products/embroidery-positions-picker";
import { SizeSelectorField } from "@/components/features/products/size-selector-field";
import {
  updateStudentOrder,
  updateEmbroideryOrder,
  type StudentOrderEditItem,
} from "@/server/actions/orders";
import { BACK_SHAPES, THREAD_COLORS } from "@/lib/orders/embroidery-options";
import { findFontByFamily, fontDisplayName } from "@/lib/constants/arabic-font-presets";
import { resolveEmbroideryDisplayName, type DiacriticsMode } from "@/lib/arabic/harakat";
import type { OrderItemMedia } from "@/lib/orders/order-item-details";
import type { Order, EmbroideryPosition, ProductType } from "@/types/database";
import type { WarkaFont } from "@/lib/settings/types";
import type { SizeGuideEntry } from "@/lib/settings/types";
import type { ProductSizePolicy } from "@/lib/settings/size-policies";
import { cn } from "@/lib/utils";

type ImageDrafts = {
  embroidery?: string | null;
  capSide?: string | null;
  capTop?: string | null;
};

type EditorRole = "student" | "embroidery";

type StudentOrderEditFormProps = {
  order: Order;
  items: StudentOrderEditItem[];
  canEdit: boolean;
  fonts: WarkaFont[];
  itemMedia: Record<string, OrderItemMedia>;
  embroideryPositionsByType: Partial<Record<ProductType, EmbroideryPosition[]>>;
  sizeGuideEntries: SizeGuideEntry[];
  sizePolicies: Record<ProductType, ProductSizePolicy>;
  locale: "ar" | "en";
  productTypeLabels: Record<ProductType, string>;
  editorRole?: EditorRole;
};

function canEditField(item: StudentOrderEditItem, key: string) {
  return item.permissions.student_editable_fields.includes(key);
}

export function StudentOrderEditForm({
  order,
  items,
  canEdit,
  fonts,
  itemMedia,
  embroideryPositionsByType,
  sizeGuideEntries,
  sizePolicies,
  locale,
  productTypeLabels,
  editorRole = "student",
}: StudentOrderEditFormProps) {
  const isEmbroidery = editorRole === "embroidery";
  const orderBasePath = isEmbroidery ? "/embroidery/orders" : "/student/orders";
  const isAr = locale === "ar";
  const router = useRouter();

  const [step, setStep] = useState<"edit" | "review">("edit");
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(items.map((item) => [item.id, { ...item.values }]))
  );
  const [diacriticsModes, setDiacriticsModes] = useState<Record<string, DiacriticsMode>>(() =>
    Object.fromEntries(items.map((item) => [item.id, "auto" as DiacriticsMode]))
  );
  const [imageDrafts, setImageDrafts] = useState<Record<string, ImageDrafts>>(() =>
    Object.fromEntries(
      items.map((item) => {
        const media = itemMedia[item.id];
        return [
          item.id,
          {
            embroidery: media?.embroideryUrl ?? null,
            capSide: media?.capSideUrl ?? null,
            capTop: media?.capTopUrl ?? null,
          },
        ];
      })
    )
  );
  const [saving, setSaving] = useState(false);

  const setField = (itemId: string, key: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [key]: value },
    }));
  };

  const setImage = (itemId: string, field: keyof ImageDrafts, value: string | null) => {
    setImageDrafts((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const buildPayload = () =>
    items.map((item) => {
      const draft = drafts[item.id] ?? {};
      const images = imageDrafts[item.id] ?? {};
      return {
        item_id: item.id,
        size: draft.size,
        custom_text: draft.custom_text,
        special_notes: draft.special_notes,
        font_family: draft.font_family,
        embroidery_position: draft.embroidery_position,
        embroidery_style: draft.embroidery_style,
        thread_color: draft.thread_color,
        back_shape: draft.back_shape,
        cap_side_notes: draft.cap_side_notes,
        cap_top_notes: draft.cap_top_notes,
        custom_measurements: draft.custom_measurements,
        ...(canEditField(item, "embroidery_image_path") && images.embroidery?.startsWith("data:")
          ? { embroidery_image_data_url: images.embroidery }
          : {}),
        ...(canEditField(item, "cap_side_embroidery_path") && images.capSide?.startsWith("data:")
          ? { cap_side_image_data_url: images.capSide }
          : {}),
        ...(canEditField(item, "cap_top_embroidery_path") && images.capTop?.startsWith("data:")
          ? { cap_top_image_data_url: images.capTop }
          : {}),
      };
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { items: buildPayload() };
      if (isEmbroidery) {
        await updateEmbroideryOrder(order.id, payload);
      } else {
        await updateStudentOrder(order.id, payload);
      }
      toast.success(
        isAr
          ? isEmbroidery
            ? "تم حفظ تعديلات التطريز"
            : "تم تأكيد وحفظ تعديلاتك"
          : isEmbroidery
            ? "Embroidery changes saved"
            : "Your changes were confirmed and saved"
      );
      router.push(`${orderBasePath}/${order.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : isAr ? "تعذّر الحفظ" : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <WarkaCard className="text-center">
        <Lock className="mx-auto mb-2 size-8 text-warka-text-muted" />
        <p className="font-medium text-warka-text">
          {isAr
            ? "الطلب مقفل بعد دفع العربون — للتعديل تواصل مع المطبعة"
            : "Order locked after deposit — contact the print shop to edit"}
        </p>
        <Link
          href={`${orderBasePath}/${order.id}`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-warka-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          {isAr ? "العودة لتفاصيل الطلب" : "Back to order details"}
        </Link>
      </WarkaCard>
    );
  }

  if (step === "review") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-10">
        <div>
          <h1 className="text-2xl font-bold text-warka-text">
            {isEmbroidery
              ? isAr
                ? "تعديل التطريز والزخرفة"
                : "Edit embroidery & decoration"
              : isAr
                ? "مراجعة وتأكيد التعديلات"
                : "Review & confirm changes"}
          </h1>
          <p className="mt-1 text-sm text-warka-text-muted">
            {isEmbroidery
              ? isAr
                ? "عدّل الخطوط والزخرفة ومواقع التطريز — إعدادات القماش والمقاس للعرض فقط."
                : "Edit fonts, decoration, and placement — fabric and size stay read-only."
              : isAr
                ? "تأكد من صحة البيانات قبل الحفظ — الحقول المقفولة من الممثل لن تتغير."
                : "Verify everything before saving — batch-locked fields stay unchanged."}
          </p>
        </div>

        {items.map((item) => {
          const draft = drafts[item.id] ?? {};
          const images = imageDrafts[item.id] ?? {};
          const displayName = resolveEmbroideryDisplayName(
            draft.custom_text ?? "",
            diacriticsModes[item.id] ?? "auto"
          );
          const positions = embroideryPositionsByType[item.product_type] ?? [];
          const positionLabel = positions.find((p) => p.key === draft.embroidery_position);

          return (
            <WarkaCard key={item.id}>
              <WarkaCardTitle className="mb-4">{productTypeLabels[item.product_type]}</WarkaCardTitle>

              {item.lockedDisplay.length > 0 && (
                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  {item.lockedDisplay.map((field) => (
                    <div
                      key={field.key}
                      className="rounded-xl border border-warka-border bg-warka-bg/60 px-3 py-2 opacity-90"
                    >
                      <p className="text-[11px] text-warka-text-muted">
                        <Lock className="me-1 inline size-3" />
                        {isAr ? field.labelAr : field.labelEn}
                      </p>
                      <p className="mt-1 text-sm font-semibold" dir="auto">
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <dl className="space-y-2 text-sm">
                {draft.custom_text && (
                  <div>
                    <dt className="text-xs text-warka-text-muted">{isAr ? "الاسم" : "Name"}</dt>
                    <dd className="font-semibold" style={{ fontFamily: draft.font_family }} dir="rtl">
                      {displayName}
                    </dd>
                  </div>
                )}
                {draft.font_family && (
                  <div>
                    <dt className="text-xs text-warka-text-muted">{isAr ? "الخط" : "Font"}</dt>
                    <dd>
                      {(() => {
                        const font = findFontByFamily(fonts, draft.font_family);
                        return font ? fontDisplayName(font, locale) : draft.font_family;
                      })()}
                    </dd>
                  </div>
                )}
                {draft.embroidery_position && positionLabel && (
                  <div>
                    <dt className="text-xs text-warka-text-muted">
                      {isAr ? "موضع التطريز" : "Embroidery position"}
                    </dt>
                    <dd>{isAr ? positionLabel.label_ar : positionLabel.label_en}</dd>
                  </div>
                )}
                {draft.thread_color && (
                  <div>
                    <dt className="text-xs text-warka-text-muted">
                      {isAr ? "لون الخيط" : "Thread color"}
                    </dt>
                    <dd>
                      {THREAD_COLORS.find((c) => c.key === draft.thread_color)?.[isAr ? "ar" : "en"] ??
                        draft.thread_color}
                    </dd>
                  </div>
                )}
                {draft.back_shape && (
                  <div>
                    <dt className="text-xs text-warka-text-muted">
                      {isAr ? "شكل الظهر" : "Back shape"}
                    </dt>
                    <dd>
                      {BACK_SHAPES.find((s) => s.key === draft.back_shape)?.[isAr ? "ar" : "en"] ??
                        draft.back_shape}
                    </dd>
                  </div>
                )}
                {draft.size && (
                  <div>
                    <dt className="text-xs text-warka-text-muted">{isAr ? "المقاس" : "Size"}</dt>
                    <dd>{draft.size}</dd>
                  </div>
                )}
                {(draft.special_notes || draft.embroidery_style) && (
                  <div>
                    <dt className="text-xs text-warka-text-muted">{isAr ? "ملاحظات" : "Notes"}</dt>
                    <dd dir="auto">{draft.special_notes || draft.embroidery_style}</dd>
                  </div>
                )}
                {images.embroidery && (
                  <p className="text-warka-primary">
                    {isAr ? "✓ مرجع زخرفة مرفوع" : "✓ Decoration reference uploaded"}
                  </p>
                )}
              </dl>
            </WarkaCard>
          );
        })}

        <div className="flex flex-wrap justify-between gap-3">
          <Button type="button" variant="outline" className="gap-2" onClick={() => setStep("edit")}>
            <ChevronLeft className="size-4" />
            {isAr ? "رجوع للتعديل" : "Back to edit"}
          </Button>
          <Button
            type="button"
            variant="accent"
            className="min-h-11 gap-2"
            disabled={saving}
            onClick={handleSave}
          >
            <CheckCircle2 className="size-4" />
            {saving
              ? isAr
                ? "جاري التأكيد…"
                : "Confirming…"
              : isAr
                ? "تأكيد وحفظ التعديلات"
                : "Confirm & save changes"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`${orderBasePath}/${order.id}`}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-warka-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            {isAr ? "تفاصيل الطلب الكاملة" : "Full order details"}
          </Link>
          <h1 className="text-2xl font-bold text-warka-text">
            {isEmbroidery
              ? isAr
                ? "ورشة التطريز — تعديل الطلب"
                : "Embroidery workshop — edit order"
              : isAr
                ? "تعديل طلبي"
                : "Edit my order"}
          </h1>
          <p className="mt-1 text-sm text-warka-text-muted">
            {order.order_number}
            {order.batch_id &&
              (isAr
                ? " · طلب جماعي — الإعدادات العامة مقفولة من الممثل"
                : " · Group order — batch settings locked by representative")}
          </p>
        </div>
      </div>

      {items.map((item) => (
        <ItemEditSection
          key={item.id}
          item={item}
          draft={drafts[item.id] ?? {}}
          images={imageDrafts[item.id] ?? {}}
          diacriticsMode={diacriticsModes[item.id] ?? "auto"}
          fonts={fonts}
          embroideryPositions={embroideryPositionsByType[item.product_type] ?? []}
          sizeGuideEntries={sizeGuideEntries}
          sizePolicies={sizePolicies}
          locale={locale}
          onFieldChange={(key, value) => setField(item.id, key, value)}
          onDiacriticsModeChange={(mode) =>
            setDiacriticsModes((prev) => ({ ...prev, [item.id]: mode }))
          }
          onImageChange={(field, value) => setImage(item.id, field, value)}
          productLabel={productTypeLabels[item.product_type]}
          editorRole={editorRole}
        />
      ))}

      <div className="flex flex-wrap justify-between gap-3">
        <Link
          href={`${orderBasePath}/${order.id}`}
          className="inline-flex min-h-11 items-center rounded-xl border border-warka-border px-4 py-2.5 text-sm font-medium text-warka-text-secondary hover:bg-warka-bg"
        >
          {isAr ? "إلغاء" : "Cancel"}
        </Link>
        <Button
          type="button"
          variant="accent"
          className="min-h-11 gap-2"
          onClick={() => setStep("review")}
        >
          {isAr ? "مراجعة قبل التأكيد" : "Review before confirming"}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ItemEditSection({
  item,
  draft,
  images,
  diacriticsMode,
  fonts,
  embroideryPositions,
  sizeGuideEntries,
  sizePolicies,
  locale,
  onFieldChange,
  onDiacriticsModeChange,
  onImageChange,
  productLabel,
  editorRole = "student",
}: {
  item: StudentOrderEditItem;
  draft: Record<string, string>;
  images: ImageDrafts;
  diacriticsMode: DiacriticsMode;
  fonts: WarkaFont[];
  embroideryPositions: EmbroideryPosition[];
  sizeGuideEntries: SizeGuideEntry[];
  sizePolicies: Record<ProductType, ProductSizePolicy>;
  locale: "ar" | "en";
  onFieldChange: (key: string, value: string) => void;
  onDiacriticsModeChange: (mode: DiacriticsMode) => void;
  onImageChange: (field: keyof ImageDrafts, value: string | null) => void;
  productLabel: string;
  editorRole?: EditorRole;
}) {
  const isEmbroidery = editorRole === "embroidery";
  const isAr = locale === "ar";
  const isCap = item.product_type === "cap";
  const displayName = resolveEmbroideryDisplayName(draft.custom_text ?? "", diacriticsMode);
  const lockedSizeField = item.lockedDisplay.find((f) => f.key === "size");

  const simpleFields = item.editableFields.filter(
    (f) =>
      ![
        "size",
        "custom_measurements",
        "custom_text",
        "font_family",
        "embroidery_position",
        "embroidery_style",
        "thread_color",
        "back_shape",
        "embroidery_image_path",
        "cap_side_embroidery_path",
        "cap_top_embroidery_path",
      ].includes(f.key)
  );

  const showEmbroideryPreview =
    canEditField(item, "custom_text") || canEditField(item, "font_family");

  return (
    <WarkaCard>
      <WarkaCardTitle className="mb-4">{productLabel}</WarkaCardTitle>

      {item.lockedDisplay.length > 0 && (
        <section className="mb-5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-warka-text-muted">
            <Lock className="size-3.5" />
            {isAr ? "محدّد من الدفعة (للعرض فقط)" : "Set by batch (read-only)"}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {item.lockedDisplay.map((field) => (
              <div
                key={field.key}
                className="rounded-xl border border-warka-border bg-warka-bg/60 px-3 py-2.5 opacity-90"
              >
                <p className="text-[11px] text-warka-text-muted">
                  {isAr ? field.labelAr : field.labelEn}
                </p>
                <p className="mt-1 text-sm font-semibold text-warka-text" dir="auto">
                  {field.value}
                </p>
                <p className="mt-1 text-[10px] text-warka-text-muted">
                  {isEmbroidery
                    ? isAr
                      ? "للقراءة فقط — يعدله الطالب أو الممثل"
                      : "Read-only — set by student or rep"
                    : isAr
                      ? "للتعديل تواصل مع الممثل أو الإدارة"
                      : "Contact rep or admin to change"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-5">
        <p className="text-xs font-bold uppercase tracking-wide text-warka-primary">
          {isEmbroidery
            ? isAr
              ? "التطريز والزخرفة والخطوط"
              : "Embroidery, decoration & fonts"
            : isAr
              ? "تخصيصك — زخرفة وخطوط وتطريز"
              : "Your choices — decoration, fonts & embroidery"}
        </p>

        {!isEmbroidery && canEditField(item, "size") && !lockedSizeField && (
          <SizeSelectorField
            productType={item.product_type}
            policies={sizePolicies}
            sizeGuideEntries={sizeGuideEntries}
            size={draft.size ?? ""}
            customMeasurements={draft.custom_measurements ?? ""}
            onSizeChange={(value) => onFieldChange("size", value)}
            onCustomMeasurementsChange={(value) => onFieldChange("custom_measurements", value)}
            locale={locale}
          />
        )}

        {!isEmbroidery && canEditField(item, "custom_measurements") && lockedSizeField && (
          <div>
            <label className="mb-1 block text-xs font-medium text-warka-text-secondary">
              {isAr ? "قياسات مخصصة" : "Custom measurements"}
            </label>
            <textarea
              value={draft.custom_measurements ?? ""}
              onChange={(e) => onFieldChange("custom_measurements", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-warka-border bg-card px-3 py-2 text-sm"
              dir="auto"
            />
          </div>
        )}

        {canEditField(item, "custom_text") && (
          <NameDiacriticsControls
            baseName={draft.custom_text ?? ""}
            mode={diacriticsMode}
            onBaseNameChange={(value) => onFieldChange("custom_text", value)}
            onModeChange={onDiacriticsModeChange}
            locale={locale}
          />
        )}

        {canEditField(item, "embroidery_image_path") && (
          <DecorationUploadField
            imageUrl={images.embroidery ?? null}
            onChange={(url) => onImageChange("embroidery", url)}
            locale={locale}
          />
        )}

        {canEditField(item, "font_family") && fonts.length > 0 && (
          <div className="space-y-2">
            <FontPickerTrigger
              fonts={fonts}
              previewText={displayName}
              selectedFontFamily={draft.font_family || null}
              onConfirm={(fontFamilyCss) => onFieldChange("font_family", fontFamilyCss)}
              locale={locale}
              required
            />
            {draft.font_family && (
              <p className="text-center text-xs text-warka-text-muted">
                {isAr ? "الخط المختار:" : "Selected:"}{" "}
                {(() => {
                  const font = findFontByFamily(fonts, draft.font_family);
                  return font ? fontDisplayName(font, locale) : draft.font_family;
                })()}
              </p>
            )}
          </div>
        )}

        {showEmbroideryPreview && (
          <EmbroideryLivePreview
            baseName={draft.custom_text ?? ""}
            diacriticsMode={diacriticsMode}
            fontFamily={draft.font_family}
            fonts={fonts}
            locale={locale}
            embedded
          />
        )}

        {canEditField(item, "embroidery_position") && embroideryPositions.length > 0 && (
          <EmbroideryPositionsPicker
            positions={embroideryPositions}
            selectedKey={draft.embroidery_position ?? ""}
            onChange={(key) => onFieldChange("embroidery_position", key)}
            locale={locale}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        )}

        {canEditField(item, "back_shape") && (
          <div>
            <Label>{isAr ? "شكل الظهر" : "Back shape"}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {BACK_SHAPES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onFieldChange("back_shape", s.key)}
                  className={cn(
                    "rounded-lg border-2 px-3 py-1.5 text-xs font-medium",
                    draft.back_shape === s.key
                      ? "border-warka-primary bg-warka-primary/10"
                      : "border-warka-border"
                  )}
                >
                  {isAr ? s.ar : s.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {canEditField(item, "thread_color") && (
          <div>
            <Label>{isAr ? "لون الخيط" : "Thread color"}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {THREAD_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onFieldChange("thread_color", c.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-xs",
                    draft.thread_color === c.key ? "border-warka-primary" : "border-warka-border"
                  )}
                >
                  <span className="size-4 rounded-full border" style={{ backgroundColor: c.hex }} />
                  {isAr ? c.ar : c.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {canEditField(item, "embroidery_style") && (
          <div>
            <Label>{isAr ? "نوع الزخرفة / التطريز" : "Decoration / embroidery style"}</Label>
            <textarea
              value={draft.embroidery_style ?? ""}
              onChange={(e) => onFieldChange("embroidery_style", e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-warka-border bg-card px-3 py-2 text-sm"
              dir="rtl"
            />
          </div>
        )}

        {isCap && canEditField(item, "cap_side_embroidery_path") && (
          <div className="space-y-2 border-t border-warka-border pt-4">
            <p className="text-sm font-semibold">
              {isAr ? "تطريز جانبي (اختياري)" : "Side embroidery (optional)"}
            </p>
            <DecorationUploadField
              imageUrl={images.capSide ?? null}
              onChange={(url) => onImageChange("capSide", url)}
              locale={locale}
              compact
            />
            {canEditField(item, "cap_side_notes") && (
              <textarea
                value={draft.cap_side_notes ?? ""}
                onChange={(e) => onFieldChange("cap_side_notes", e.target.value)}
                rows={2}
                placeholder={isAr ? "ملاحظات جانب القبعة" : "Cap side notes"}
                className="w-full rounded-xl border border-warka-border px-3 py-2 text-sm"
              />
            )}
          </div>
        )}

        {isCap && canEditField(item, "cap_top_embroidery_path") && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              {isAr ? "تطريز علوي (اختياري)" : "Top embroidery (optional)"}
            </p>
            <DecorationUploadField
              imageUrl={images.capTop ?? null}
              onChange={(url) => onImageChange("capTop", url)}
              locale={locale}
              compact
            />
            {canEditField(item, "cap_top_notes") && (
              <textarea
                value={draft.cap_top_notes ?? ""}
                onChange={(e) => onFieldChange("cap_top_notes", e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-warka-border px-3 py-2 text-sm"
              />
            )}
          </div>
        )}

        {simpleFields.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {simpleFields.map((field) => (
              <div
                key={field.key}
                className={cn(field.key === "special_notes" && "sm:col-span-2")}
              >
                <label className="mb-1 block text-xs font-medium text-warka-text-secondary">
                  {isAr ? field.labelAr : field.labelEn}
                </label>
                {field.key === "special_notes" ? (
                  <textarea
                    value={draft[field.key] ?? ""}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-warka-border bg-card px-3 py-2 text-sm"
                    dir="auto"
                  />
                ) : (
                  <Input
                    value={draft[field.key] ?? ""}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    className="border-warka-border"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </WarkaCard>
  );
}
