"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Layers, MapPin, BookOpen, Palette, Ruler, Plus, Trash2 } from "lucide-react";
import {
  deleteCustomizationRow,
  upsertCustomizationZone,
  upsertEmbroideryColor,
  upsertEmbroiderySizeRule,
  upsertGownAddition,
  upsertProductStyle,
  upsertTextLibraryEntry,
  upsertZoneContentOption,
} from "@/server/actions/customization";
import type { Product } from "@/types/database";
import { WARKA_LAYOUT_BY_TYPE } from "@/lib/customization/warka-product-layouts";
import {
  CONTENT_TYPE_KEYS,
  OPTION_TYPE_KEYS,
  TEXT_CATEGORY_KEYS,
} from "@/lib/customization/admin-labels";
import { PageHeader } from "@/components/ui/page-header";
import { DecorationUploadField } from "@/components/features/embroidery/decoration-upload-field";
import { cn } from "@/lib/utils";

type Tab = "styles" | "zones" | "options" | "texts" | "colors" | "gown";

type AdminBundle = Awaited<
  ReturnType<typeof import("@/server/actions/customization").getAdminCustomizationBundle>
>;

type CustomizationAdminViewProps = {
  products: Pick<Product, "id" | "product_type" | "name_ar" | "name_en">[];
  initialProductId: string;
  initialData: AdminBundle;
};

export function CustomizationAdminView({
  products,
  initialProductId,
  initialData,
}: CustomizationAdminViewProps) {
  const t = useTranslations("adminCustomization");
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [productId, setProductId] = useState(initialProductId);
  const [tab, setTab] = useState<Tab>("styles");
  const [saving, setSaving] = useState(false);

  const data = initialData;

  const tabs: { id: Tab; label: string; icon: typeof Layers }[] = [
    { id: "styles", label: t("tabStyles"), icon: Layers },
    { id: "zones", label: t("tabZones"), icon: MapPin },
    { id: "options", label: t("tabOptions"), icon: Ruler },
    { id: "texts", label: t("tabTexts"), icon: BookOpen },
    { id: "colors", label: t("tabColors"), icon: Palette },
    { id: "gown", label: t("tabGown"), icon: Plus },
  ];

  const onProductChange = (id: string) => {
    setProductId(id);
    router.push(`/admin/customization?product=${id}`);
  };

  const selectedProduct = products.find((p) => p.id === productId);
  const layoutGuide = selectedProduct ? WARKA_LAYOUT_BY_TYPE[selectedProduct.product_type] : null;

  const productTypeLabel = (type: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`productTypes.${type}` as any);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="rounded-2xl border border-warka-primary/20 bg-warka-primary/5 p-4 sm:p-5">
        <h2 className="text-sm font-bold text-warka-text">{t("howTitle")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-warka-text-secondary">{t("howIntro")}</p>
        <ol className="mt-3 space-y-1.5 text-xs leading-relaxed text-warka-text-secondary">
          <li>{t("howStep1")}</li>
          <li>{t("howStep2")}</li>
          <li>{t("howStep3")}</li>
          <li>{t("howStep4")}</li>
          <li>{t("howStep5")}</li>
          <li>{t("howStep6")}</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-glass-border glass p-4">
        <label className="mb-1 block text-sm font-medium">{t("selectProduct")}</label>
        <select
          className="w-full max-w-md rounded-lg border border-glass-border bg-card px-3 py-2"
          value={productId}
          onChange={(e) => onProductChange(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {isAr ? p.name_ar : p.name_en} — {productTypeLabel(p.product_type)}
            </option>
          ))}
        </select>
      </div>

      {layoutGuide && (
        <div className="rounded-2xl border border-warka-border bg-card p-4">
          <h3 className="text-sm font-bold text-warka-primary">
            {isAr ? layoutGuide.title_ar : layoutGuide.title_en}
          </h3>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-warka-text-secondary">
            {layoutGuide.steps.map((step, i) => (
              <li key={i}>{isAr ? step.ar : step.en}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-glass-border pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              tab === id ? "bg-warka-primary text-white" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "styles" && (
        <StylesPanel
          productId={productId}
          styles={data.styles}
          saving={saving}
          setSaving={setSaving}
          isAr={isAr}
          t={t}
          onRefresh={() => router.refresh()}
        />
      )}
      {tab === "zones" && (
        <ZonesPanel
          productId={productId}
          zones={data.zones}
          sizeRules={data.size_rules}
          saving={saving}
          setSaving={setSaving}
          isAr={isAr}
          t={t}
          onRefresh={() => router.refresh()}
        />
      )}
      {tab === "options" && (
        <OptionsPanel
          zones={data.zones}
          options={data.options}
          sizeRules={data.size_rules}
          saving={saving}
          setSaving={setSaving}
          isAr={isAr}
          t={t}
          onRefresh={() => router.refresh()}
        />
      )}
      {tab === "texts" && (
        <TextsPanel
          entries={data.text_library}
          saving={saving}
          setSaving={setSaving}
          isAr={isAr}
          t={t}
          onRefresh={() => router.refresh()}
        />
      )}
      {tab === "colors" && (
        <ColorsPanel
          colors={data.embroidery_colors}
          saving={saving}
          setSaving={setSaving}
          isAr={isAr}
          t={t}
          onRefresh={() => router.refresh()}
        />
      )}
      {tab === "gown" && (
        <GownPanel
          productId={productId}
          additions={data.gown_additions}
          saving={saving}
          setSaving={setSaving}
          isAr={isAr}
          t={t}
          onRefresh={() => router.refresh()}
        />
      )}
    </div>
  );
}

function labelFromMap(
  t: ReturnType<typeof useTranslations<"adminCustomization">>,
  mapKey: "contentTypes" | "optionTypes" | "textCategories",
  value: string
): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return t(`${mapKey}.${value}` as any);
}

function StylesPanel({
  productId,
  styles,
  saving,
  setSaving,
  isAr,
  t,
  onRefresh,
}: {
  productId: string;
  styles: Record<string, unknown>[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  isAr: boolean;
  t: ReturnType<typeof useTranslations<"adminCustomization">>;
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState({
    style_key: "",
    style_name_ar: "",
    style_name_en: "",
    preview_image_url: "" as string | null,
  });

  const add = async () => {
    if (!draft.style_name_ar.trim()) return toast.error(t("nameRequired"));
    setSaving(true);
    try {
      await upsertProductStyle({
        product_id: productId,
        style_key: draft.style_key || draft.style_name_ar,
        style_name_ar: draft.style_name_ar,
        style_name_en: draft.style_name_en,
        preview_image_url: draft.preview_image_url || undefined,
        sort_order: styles.length,
      });
      toast.success(t("saved"));
      setDraft({ style_key: "", style_name_ar: "", style_name_en: "", preview_image_url: null });
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <input className="warka-input" placeholder={t("styleKey")} value={draft.style_key} onChange={(e) => setDraft({ ...draft, style_key: e.target.value })} />
        <input className="warka-input" placeholder={t("nameAr")} value={draft.style_name_ar} onChange={(e) => setDraft({ ...draft, style_name_ar: e.target.value })} />
        <input className="warka-input" placeholder={t("nameEn")} value={draft.style_name_en} onChange={(e) => setDraft({ ...draft, style_name_en: e.target.value })} />
      </div>
      <DecorationUploadField
        imageUrl={draft.preview_image_url}
        onChange={(url) => setDraft({ ...draft, preview_image_url: url })}
        locale={isAr ? "ar" : "en"}
        label={t("previewImage")}
      />
      <button type="button" disabled={saving} onClick={() => void add()} className="rounded-lg bg-warka-primary px-4 py-2 text-sm font-semibold text-white">
        <Plus className="me-1 inline size-4" />
        {t("addStyle")}
      </button>
      <ul className="space-y-2">
        {styles.map((s) => (
          <li key={String(s.id)} className="space-y-2 rounded-xl border border-glass-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{isAr ? String(s.style_name_ar) : String(s.style_name_en ?? s.style_name_ar)}</span>
              <button type="button" className="text-destructive" onClick={() => void deleteCustomizationRow("product_styles", String(s.id)).then(onRefresh)}>
                <Trash2 className="size-4" />
              </button>
            </div>
            <StylePreviewUpload
              style={s}
              productId={productId}
              isAr={isAr}
              label={t("previewImage")}
              onSaved={onRefresh}
              setSaving={setSaving}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ZonesPanel({
  productId,
  zones,
  sizeRules,
  saving,
  setSaving,
  isAr,
  t,
  onRefresh,
}: {
  productId: string;
  zones: Record<string, unknown>[];
  sizeRules: Record<string, unknown>[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  isAr: boolean;
  t: ReturnType<typeof useTranslations<"adminCustomization">>;
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState({
    zone_key: "",
    zone_label_ar: "",
    content_type: "name_major",
    sort_order: zones.length,
  });

  const add = async () => {
    if (!draft.zone_label_ar.trim()) return toast.error(t("nameRequired"));
    setSaving(true);
    try {
      await upsertCustomizationZone({ product_id: productId, ...draft, is_required: false });
      toast.success(t("saved"));
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("zoneKey")}</label>
          <input
            className="warka-input"
            dir="ltr"
            placeholder={t("zoneKeyHint")}
            value={draft.zone_key}
            onChange={(e) => setDraft({ ...draft, zone_key: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("nameAr")}</label>
          <input
            className="warka-input"
            placeholder={isAr ? "مثال: اليسار — الاسم" : "e.g. Left — name"}
            value={draft.zone_label_ar}
            onChange={(e) => setDraft({ ...draft, zone_label_ar: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("contentType")}</label>
          <select
            className="warka-input"
            value={draft.content_type}
            onChange={(e) => setDraft({ ...draft, content_type: e.target.value })}
          >
            {CONTENT_TYPE_KEYS.map((key) => (
              <option key={key} value={key}>
                {labelFromMap(t, "contentTypes", key)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => void add()}
            className="w-full rounded-lg bg-warka-primary px-3 py-2.5 text-sm font-semibold text-white"
          >
            {t("addZone")}
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {zones.map((z) => {
          const rules = sizeRules.filter((r) => r.zone_id === z.id);
          return (
            <li key={String(z.id)} className="rounded-xl border border-glass-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {isAr ? String(z.zone_label_ar) : String(z.zone_label_en ?? z.zone_label_ar)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {labelFromMap(t, "contentTypes", String(z.content_type))}
                    <span className="mx-1 opacity-50">·</span>
                    <span dir="ltr" className="font-mono text-[10px]">
                      {String(z.zone_key)}
                    </span>
                  </p>
                </div>
                <button type="button" className="text-destructive" onClick={() => void deleteCustomizationRow("customization_zones", String(z.id)).then(onRefresh)}>
                  <Trash2 className="size-4" />
                </button>
              </div>
              {rules.length > 0 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Ruler className="size-3" />
                  {rules.length} {t("sizeRules")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TextsPanel({
  entries,
  saving,
  setSaving,
  isAr,
  t,
  onRefresh,
}: {
  entries: Record<string, unknown>[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  isAr: boolean;
  t: ReturnType<typeof useTranslations<"adminCustomization">>;
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState({ category: "quran_verse", content_ar: "" });

  const add = async () => {
    if (!draft.content_ar.trim()) return;
    setSaving(true);
    try {
      await upsertTextLibraryEntry({ ...draft, sort_order: entries.length });
      toast.success(t("saved"));
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("textCategory")}</label>
          <select
            className="warka-input"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            {TEXT_CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>
                {labelFromMap(t, "textCategories", key)}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("textContent")}</label>
          <input
            className="warka-input"
            placeholder={isAr ? "اكتب الآية أو الاقتباس…" : "Enter verse or quote…"}
            value={draft.content_ar}
            onChange={(e) => setDraft({ ...draft, content_ar: e.target.value })}
          />
        </div>
      </div>
      <button type="button" disabled={saving} onClick={() => void add()} className="rounded-lg bg-warka-primary px-4 py-2 text-sm text-white">
        {t("addText")}
      </button>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={String(e.id)} className="flex justify-between rounded-xl border p-3 text-sm">
            <span>{String(e.content_ar)}</span>
            <button type="button" className="text-destructive" onClick={() => void deleteCustomizationRow("text_library", String(e.id)).then(onRefresh)}>
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ColorsPanel({
  colors,
  saving,
  setSaving,
  isAr,
  t,
  onRefresh,
}: {
  colors: Record<string, unknown>[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  isAr: boolean;
  t: ReturnType<typeof useTranslations<"adminCustomization">>;
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState({ color_name_ar: "", hex_code: "#C9A227" });

  const add = async () => {
    if (!draft.color_name_ar.trim()) return;
    setSaving(true);
    try {
      await upsertEmbroideryColor({ ...draft, sort_order: colors.length });
      toast.success(t("saved"));
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input className="warka-input max-w-xs" placeholder={t("nameAr")} value={draft.color_name_ar} onChange={(e) => setDraft({ ...draft, color_name_ar: e.target.value })} />
        <input type="color" value={draft.hex_code} onChange={(e) => setDraft({ ...draft, hex_code: e.target.value })} className="h-10 w-14" />
        <button type="button" disabled={saving} onClick={() => void add()} className="rounded-lg bg-warka-primary px-4 py-2 text-sm text-white">
          {t("addColor")}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <div key={String(c.id)} className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <span className="size-6 rounded-full border" style={{ backgroundColor: String(c.hex_code ?? "#ccc") }} />
            <span className="text-sm">{isAr ? String(c.color_name_ar) : String(c.color_name_en ?? c.color_name_ar)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionsPanel({
  zones,
  options,
  sizeRules,
  saving,
  setSaving,
  isAr,
  t,
  onRefresh,
}: {
  zones: Record<string, unknown>[];
  options: Record<string, unknown>[];
  sizeRules: Record<string, unknown>[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  isAr: boolean;
  t: ReturnType<typeof useTranslations<"adminCustomization">>;
  onRefresh: () => void;
}) {
  const [optDraft, setOptDraft] = useState({
    zone_id: String(zones[0]?.id ?? ""),
    option_name_ar: "",
    option_type: "preset_pattern",
  });
  const [ruleDraft, setRuleDraft] = useState({
    zone_id: String(zones[0]?.id ?? ""),
    min_chars: 1,
    max_chars: 20,
    embroidery_size_mm: 50,
  });

  const addOption = async () => {
    if (!optDraft.zone_id || !optDraft.option_name_ar.trim()) return;
    setSaving(true);
    try {
      await upsertZoneContentOption({
        zone_id: optDraft.zone_id,
        option_name_ar: optDraft.option_name_ar,
        option_type: optDraft.option_type,
        sort_order: options.length,
      });
      toast.success(t("saved"));
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  const addRule = async () => {
    if (!ruleDraft.zone_id) return;
    setSaving(true);
    try {
      await upsertEmbroiderySizeRule({
        ...ruleDraft,
        sort_order: sizeRules.length,
      });
      toast.success(t("saved"));
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  const zoneLabel = (zoneId: unknown) => {
    const z = zones.find((x) => x.id === zoneId);
    return z ? String(isAr ? z.zone_label_ar : z.zone_label_en ?? z.zone_label_ar) : String(zoneId);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border border-glass-border p-4">
        <p className="text-sm font-semibold">{t("addOption")}</p>
        <div className="grid gap-2 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("selectZone")}</label>
            <select
              className="warka-input"
              value={optDraft.zone_id}
              onChange={(e) => setOptDraft({ ...optDraft, zone_id: e.target.value })}
            >
              {zones.map((z) => (
                <option key={String(z.id)} value={String(z.id)}>
                  {zoneLabel(z.id)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("nameAr")}</label>
            <input
              className="warka-input"
              value={optDraft.option_name_ar}
              onChange={(e) => setOptDraft({ ...optDraft, option_name_ar: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("optionType")}</label>
            <select
              className="warka-input"
              value={optDraft.option_type}
              onChange={(e) => setOptDraft({ ...optDraft, option_type: e.target.value })}
            >
              {OPTION_TYPE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {labelFromMap(t, "optionTypes", key)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => void addOption()}
              className="w-full rounded-lg bg-warka-primary px-3 py-2 text-sm text-white"
            >
              {t("addOption")}
            </button>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {options.map((o) => (
            <li key={String(o.id)} className="space-y-2 rounded-lg border px-3 py-2">
              <div className="flex justify-between gap-2">
                <span>
                  {zoneLabel(o.zone_id)} · {String(o.option_name_ar)} (
                  {labelFromMap(t, "optionTypes", String(o.option_type))})
                </span>
                <button type="button" className="shrink-0 text-destructive" onClick={() => void deleteCustomizationRow("zone_content_options", String(o.id)).then(onRefresh)}>
                  <Trash2 className="size-4" />
                </button>
              </div>
              {String(o.option_type) === "preset_pattern" && (
                <OptionPreviewUpload
                  option={o}
                  isAr={isAr}
                  label={t("previewImage")}
                  onSaved={onRefresh}
                  setSaving={setSaving}
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 rounded-xl border border-glass-border p-4">
        <p className="text-sm font-semibold">{t("addSizeRule")}</p>
        <div className="grid gap-2 sm:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("selectZone")}</label>
            <select
              className="warka-input"
              value={ruleDraft.zone_id}
              onChange={(e) => setRuleDraft({ ...ruleDraft, zone_id: e.target.value })}
            >
              {zones.map((z) => (
                <option key={String(z.id)} value={String(z.id)}>
                  {zoneLabel(z.id)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("minChars")}</label>
            <input
              type="number"
              className="warka-input"
              value={ruleDraft.min_chars}
              onChange={(e) => setRuleDraft({ ...ruleDraft, min_chars: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("maxChars")}</label>
            <input
              type="number"
              className="warka-input"
              value={ruleDraft.max_chars}
              onChange={(e) => setRuleDraft({ ...ruleDraft, max_chars: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("sizeMm")}</label>
            <input
              type="number"
              className="warka-input"
              value={ruleDraft.embroidery_size_mm}
              onChange={(e) =>
                setRuleDraft({ ...ruleDraft, embroidery_size_mm: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => void addRule()}
              className="w-full rounded-lg bg-warka-primary px-3 py-2 text-sm text-white"
            >
              {t("addSizeRule")}
            </button>
          </div>
        </div>
        <ul className="space-y-1 text-sm">
          {sizeRules.map((r) => (
            <li key={String(r.id)} className="flex justify-between rounded-lg border px-3 py-2">
              <span>
                {zoneLabel(r.zone_id)}: {String(r.min_chars)}–{String(r.max_chars)} → {String(r.embroidery_size_mm)} mm
              </span>
              <button type="button" className="text-destructive" onClick={() => void deleteCustomizationRow("embroidery_size_rules", String(r.id)).then(onRefresh)}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function GownPanel({
  productId,
  additions,
  saving,
  setSaving,
  isAr,
  t,
  onRefresh,
}: {
  productId: string;
  additions: Record<string, unknown>[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  isAr: boolean;
  t: ReturnType<typeof useTranslations<"adminCustomization">>;
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState({ addition_key: "", addition_name_ar: "" });

  const add = async () => {
    if (!draft.addition_name_ar.trim()) return;
    setSaving(true);
    try {
      await upsertGownAddition({
        product_id: productId,
        addition_key: draft.addition_key || draft.addition_name_ar,
        addition_name_ar: draft.addition_name_ar,
        sort_order: additions.length,
      });
      toast.success(t("saved"));
      setDraft({ addition_key: "", addition_name_ar: "" });
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("additionKey")}</label>
          <input
            className="warka-input"
            dir="ltr"
            placeholder={t("zoneKeyHint")}
            value={draft.addition_key}
            onChange={(e) => setDraft({ ...draft, addition_key: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("nameAr")}</label>
          <input
            className="warka-input"
            value={draft.addition_name_ar}
            onChange={(e) => setDraft({ ...draft, addition_name_ar: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => void add()}
            className="w-full rounded-lg bg-warka-primary px-3 py-2 text-sm text-white"
          >
            {t("addGown")}
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {additions.map((a) => (
          <li key={String(a.id)} className="flex items-center justify-between rounded-xl border p-3">
            <span>{isAr ? String(a.addition_name_ar) : String(a.addition_name_en ?? a.addition_name_ar)}</span>
            <button type="button" className="text-destructive" onClick={() => void deleteCustomizationRow("gown_additions", String(a.id)).then(onRefresh)}>
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StylePreviewUpload({
  style,
  productId,
  isAr,
  label,
  onSaved,
  setSaving,
}: {
  style: Record<string, unknown>;
  productId: string;
  isAr: boolean;
  label: string;
  onSaved: () => void;
  setSaving: (v: boolean) => void;
}) {
  const save = async (url: string | null) => {
    setSaving(true);
    try {
      await upsertProductStyle({
        id: String(style.id),
        product_id: productId,
        style_key: String(style.style_key),
        style_name_ar: String(style.style_name_ar),
        style_name_en: String(style.style_name_en ?? ""),
        preview_image_url: url ?? undefined,
        sort_order: Number(style.sort_order ?? 0),
      });
      toast.success("saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DecorationUploadField
      imageUrl={(style.preview_image_url as string) ?? null}
      onChange={(url) => void save(url)}
      locale={isAr ? "ar" : "en"}
      label={label}
    />
  );
}

function OptionPreviewUpload({
  option,
  isAr,
  label,
  onSaved,
  setSaving,
}: {
  option: Record<string, unknown>;
  isAr: boolean;
  label: string;
  onSaved: () => void;
  setSaving: (v: boolean) => void;
}) {
  const save = async (url: string | null) => {
    setSaving(true);
    try {
      await upsertZoneContentOption({
        id: String(option.id),
        zone_id: String(option.zone_id),
        option_key: option.option_key ? String(option.option_key) : undefined,
        option_name_ar: String(option.option_name_ar),
        option_name_en: option.option_name_en ? String(option.option_name_en) : undefined,
        option_type: String(option.option_type),
        preview_image_url: url ?? undefined,
        sort_order: Number(option.sort_order ?? 0),
      });
      toast.success("saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DecorationUploadField
      imageUrl={(option.preview_image_url as string) ?? null}
      onChange={(url) => void save(url)}
      locale={isAr ? "ar" : "en"}
      label={label}
    />
  );
}
