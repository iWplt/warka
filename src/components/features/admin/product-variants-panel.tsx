"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Plus, Trash2, Layers, Palette } from "lucide-react";
import {
  removeProductVariantImage,
  updateProductVariants,
  uploadProductFabricImage,
  uploadProductVariantImage,
} from "@/server/actions/products";
import {
  DEFAULT_COLOR_HEX,
  DEFAULT_COLOR_LABELS,
  colorKeyFromLabel,
  resolveColorVariants,
  resolveFabricOptions,
} from "@/lib/products/variants";
import type { Product, ProductColorVariant, ProductFabricOption } from "@/types/database";
import { ImageCropUpload } from "@/components/ui/image-crop-upload";
import { cn } from "@/lib/utils";

type ProductVariantsPanelProps = {
  product: Product;
};

/** Practical upper bound — not a fixed product requirement */
const MAX_COLORS = 99;

const PRESET_COLORS = DEFAULT_COLOR_LABELS.map((label) => ({
  label,
  hex: DEFAULT_COLOR_HEX[label] ?? "#cccccc",
  key: colorKeyFromLabel(label),
}));

const PRESET_ORDER = PRESET_COLORS.map((p) => p.key);
const PRESET_KEY_SET = new Set(PRESET_ORDER);

function sortVariants(variants: ProductColorVariant[]): ProductColorVariant[] {
  const presets = PRESET_ORDER.map((key) => variants.find((v) => v.key === key)).filter(
    (v): v is ProductColorVariant => v !== undefined
  );
  const customs = variants.filter((v) => !PRESET_KEY_SET.has(v.key));
  return [...presets, ...customs];
}

function normalizeVariants(product: Product): ProductColorVariant[] {
  const resolved = resolveColorVariants({
    color_variants: product.color_variants ?? [],
    colors: product.colors,
    image: product.image,
    gallery: product.gallery,
  });
  return sortVariants(resolved.slice(0, MAX_COLORS));
}

function createCustomColorKey(labelAr: string, existing: ProductColorVariant[]): string {
  let base = colorKeyFromLabel(labelAr);
  if (!base || PRESET_KEY_SET.has(base)) {
    base = `custom-${base || "color"}`;
  }
  let key = base;
  let n = 1;
  while (existing.some((v) => v.key === key)) {
    key = `${base}-${n++}`;
  }
  return key.slice(0, 48);
}

function getVariantImagesForFabric(
  variant: ProductColorVariant,
  fabricKey: string
): string[] {
  if (fabricKey === "standard") return variant.images;
  return variant.fabric_images?.[fabricKey] ?? [];
}

export function ProductVariantsPanel({ product }: ProductVariantsPanelProps) {
  const t = useTranslations("adminProducts");
  const locale = useLocale();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState({
    label_ar: "",
    label_en: "",
    hex: "#888888",
  });

  const initialVariants = useMemo(() => normalizeVariants(product), [product]);
  const initialFabrics = useMemo(
    () => resolveFabricOptions(product.fabric_options ?? []),
    [product.fabric_options]
  );

  const [variants, setVariants] = useState<ProductColorVariant[]>(initialVariants);
  const [fabrics, setFabrics] = useState<ProductFabricOption[]>(initialFabrics);
  const [activeColorKey, setActiveColorKey] = useState<string | null>(
    initialVariants[0]?.key ?? null
  );
  const [activeFabricKey, setActiveFabricKey] = useState(fabrics[0]?.key ?? "standard");

  const activeVariant =
    variants.find((v) => v.key === activeColorKey) ?? variants[0] ?? null;
  const activeFabric =
    fabrics.find((f) => f.key === activeFabricKey) ?? fabrics[0] ?? null;

  const isColorActive = (key: string) => variants.some((v) => v.key === key);

  const addPresetColor = (preset: (typeof PRESET_COLORS)[number]) => {
    if (isColorActive(preset.key)) {
      setActiveColorKey(preset.key);
      return;
    }
    if (variants.length >= MAX_COLORS) {
      toast.error(t("colorsLimit", { max: MAX_COLORS }));
      return;
    }
    setVariants((prev) =>
      sortVariants([
        ...prev,
        {
          key: preset.key,
          label_ar: preset.label,
          label_en: preset.label,
          hex: preset.hex,
          images: [],
        },
      ])
    );
    setActiveColorKey(preset.key);
  };

  const addCustomColor = () => {
    const labelAr = customDraft.label_ar.trim();
    if (!labelAr) {
      toast.error(t("colorNameRequired"));
      return;
    }
    if (variants.length >= MAX_COLORS) {
      toast.error(t("colorsLimit", { max: MAX_COLORS }));
      return;
    }
    const labelEn = customDraft.label_en.trim() || labelAr;
    const key = createCustomColorKey(labelAr, variants);
    setVariants((prev) =>
      sortVariants([
        ...prev,
        {
          key,
          label_ar: labelAr,
          label_en: labelEn,
          hex: customDraft.hex,
          images: [],
        },
      ])
    );
    setActiveColorKey(key);
    setCustomDraft({ label_ar: "", label_en: "", hex: "#888888" });
    setShowAddCustom(false);
    toast.success(t("colorAdded"));
  };

  const removeColor = (key: string) => {
    if (variants.length <= 1) {
      toast.error(t("colorMinOne"));
      return;
    }
    const next = variants.filter((v) => v.key !== key);
    setVariants(next);
    if (activeColorKey === key) setActiveColorKey(next[0]?.key ?? null);
  };

  const updateVariant = (key: string, patch: Partial<ProductColorVariant>) => {
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  };

  const updateFabric = (key: string, patch: Partial<ProductFabricOption>) => {
    setFabrics((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  };

  const handleColorFabricUpload = async (
    colorKey: string,
    fabricKey: string,
    dataUrl: string
  ) => {
    setUploading(`${colorKey}-${fabricKey}`);
    try {
      const url = await uploadProductVariantImage(product.id, colorKey, dataUrl, fabricKey);
      setVariants((prev) =>
        prev.map((v) => {
          if (v.key !== colorKey) return v;
          if (fabricKey === "standard") {
            return { ...v, images: v.images.includes(url) ? v.images : [url, ...v.images] };
          }
          const fabric_images = { ...v.fabric_images };
          const list = fabric_images[fabricKey] ?? [];
          fabric_images[fabricKey] = list.includes(url) ? list : [url, ...list];
          return { ...v, fabric_images };
        })
      );
      toast.success(t("imageSaved"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveColorFabricImage = async (
    colorKey: string,
    fabricKey: string,
    imageUrl: string
  ) => {
    if (!confirm(t("confirmRemoveImage"))) return;
    setUploading(`${colorKey}-rm`);
    try {
      await removeProductVariantImage(product.id, colorKey, imageUrl, fabricKey);
      setVariants((prev) =>
        prev.map((v) => {
          if (v.key !== colorKey) return v;
          if (fabricKey === "standard") {
            return { ...v, images: v.images.filter((u) => u !== imageUrl) };
          }
          return {
            ...v,
            fabric_images: {
              ...v.fabric_images,
              [fabricKey]: (v.fabric_images?.[fabricKey] ?? []).filter((u) => u !== imageUrl),
            },
          };
        })
      );
      toast.success(t("imageRemoved"));
      router.refresh();
    } catch {
      toast.error(t("error"));
    } finally {
      setUploading(null);
    }
  };

  const handleFabricSampleUpload = async (fabricKey: string, dataUrl: string) => {
    setUploading(`fabric-${fabricKey}`);
    try {
      const url = await uploadProductFabricImage(product.id, fabricKey, dataUrl);
      updateFabric(fabricKey, { image: url });
      toast.success(t("imageSaved"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (variants.length === 0) {
      toast.error(t("colorMinOne"));
      return;
    }
    setSaving(true);
    try {
      await updateProductVariants({
        productId: product.id,
        color_variants: sortVariants(variants),
        fabric_options: fabrics,
      });
      toast.success(t("variantsSaved"));
      router.refresh();
    } catch {
      toast.error(t("error"));
    } finally {
      setSaving(false);
    }
  };

  const fabricColorImages =
    activeVariant && activeFabric
      ? getVariantImagesForFabric(activeVariant, activeFabric.key)
      : [];

  return (
    <div className="mt-6 space-y-5 rounded-[14px] border border-warka-border bg-warka-bg/50 p-4">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-warka-primary" />
            <h3 className="text-sm font-bold text-warka-text">{t("colorSectionTitle")}</h3>
          </div>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-warka-text-muted">
            {t("colorsCount", { count: variants.length })}
          </span>
        </div>
        <p className="text-xs text-warka-text-secondary">{t("colorSectionHint")}</p>

        <div>
          <p className="mb-2 text-xs font-semibold text-warka-text">{t("presetColors")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESET_COLORS.map((preset) => {
              const active = isColorActive(preset.key);
              const selected = activeColorKey === preset.key;

              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => addPresetColor(preset)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-[14px] border-2 px-3 py-3 text-center transition-all",
                    active && selected
                      ? "border-warka-primary bg-white shadow-card ring-2 ring-warka-primary/20"
                      : active
                        ? "border-warka-primary/60 bg-white"
                        : "border-dashed border-warka-border bg-white/60 hover:border-warka-primary/40"
                  )}
                >
                  {active && (
                    <span className="absolute top-2 end-2 flex size-5 items-center justify-center rounded-full bg-warka-primary text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                  <span
                    className="size-10 rounded-full border-2 border-white shadow-sm ring-1 ring-warka-border"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="text-xs font-semibold text-warka-text">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {!showAddCustom ? (
            <button
              type="button"
              onClick={() => setShowAddCustom(true)}
              className="inline-flex items-center gap-2 rounded-[10px] border-2 border-dashed border-warka-primary/50 bg-white px-4 py-2.5 text-sm font-semibold text-warka-primary transition-colors hover:border-warka-primary hover:bg-warka-primary/5"
            >
              <Plus className="size-4" />
              {t("addCustomColor")}
            </button>
          ) : (
            <div className="rounded-[14px] border border-warka-border bg-white p-4">
              <p className="mb-3 text-xs font-semibold text-warka-text">{t("addCustomColor")}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="warka-label">{t("colorNameAr")}</label>
                  <input
                    value={customDraft.label_ar}
                    onChange={(e) =>
                      setCustomDraft((d) => ({ ...d, label_ar: e.target.value }))
                    }
                    className="warka-input"
                    placeholder={t("colorNameArPlaceholder")}
                  />
                </div>
                <div>
                  <label className="warka-label">{t("colorNameEn")}</label>
                  <input
                    value={customDraft.label_en}
                    onChange={(e) =>
                      setCustomDraft((d) => ({ ...d, label_en: e.target.value }))
                    }
                    className="warka-input"
                    placeholder={t("colorNameEnPlaceholder")}
                  />
                </div>
                <div>
                  <label className="warka-label">{t("colorHex")}</label>
                  <input
                    type="color"
                    value={customDraft.hex}
                    onChange={(e) =>
                      setCustomDraft((d) => ({ ...d, hex: e.target.value }))
                    }
                    className="h-10 w-full cursor-pointer rounded-[10px] border border-warka-border"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addCustomColor}
                  className="rounded-[10px] bg-warka-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("confirmAddColor")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="rounded-[10px] border border-warka-border bg-white px-4 py-2 text-sm font-medium text-warka-text"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>

        {variants.length === 0 ? (
          <p className="rounded-[10px] border border-dashed border-warka-border bg-white px-4 py-6 text-center text-sm text-warka-text-muted">
            {t("noColorsYet")}
          </p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold text-warka-text">{t("activeColors")}</p>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-[10px] border border-warka-border bg-white p-2">
                {variants.map((variant) => (
                  <div key={variant.key} className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveColorKey(variant.key)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors",
                        activeColorKey === variant.key
                          ? "bg-warka-primary text-white"
                          : "border border-warka-border bg-warka-bg text-warka-text hover:border-warka-primary/50"
                      )}
                    >
                      <span
                        className="size-3.5 rounded-full border border-white/30"
                        style={{ backgroundColor: variant.hex }}
                      />
                      {variant.label_ar}
                      {!PRESET_KEY_SET.has(variant.key) && (
                        <span className="opacity-60">({t("custom")})</span>
                      )}
                    </button>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColor(variant.key)}
                        className="rounded-lg p-1 text-destructive hover:bg-destructive/10"
                        title={t("removeColor")}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {activeVariant && (
              <div className="rounded-[14px] border border-warka-border bg-white p-4">
                <p className="mb-3 text-xs font-semibold text-warka-text">
                  {t("editingColor", { name: activeVariant.label_ar })}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="warka-label">{t("colorNameAr")}</label>
                    <input
                      value={activeVariant.label_ar}
                      onChange={(e) =>
                        updateVariant(activeVariant.key, { label_ar: e.target.value })
                      }
                      className="warka-input"
                    />
                  </div>
                  <div>
                    <label className="warka-label">{t("colorNameEn")}</label>
                    <input
                      value={activeVariant.label_en}
                      onChange={(e) =>
                        updateVariant(activeVariant.key, { label_en: e.target.value })
                      }
                      className="warka-input"
                    />
                  </div>
                  <div>
                    <label className="warka-label">{t("colorHex")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeVariant.hex}
                        onChange={(e) =>
                          updateVariant(activeVariant.key, { hex: e.target.value })
                        }
                        className="size-10 shrink-0 cursor-pointer rounded-[10px] border border-warka-border"
                      />
                      <span className="text-xs text-warka-text-muted" dir="ltr">
                        {activeVariant.hex}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="space-y-3 rounded-[14px] border border-warka-border bg-white p-4">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-warka-primary" />
          <h3 className="text-sm font-bold text-warka-text">{t("fabricSectionTitle")}</h3>
        </div>
        <p className="text-xs text-warka-text-secondary">{t("fabricSectionHint")}</p>

        <div className="flex flex-wrap gap-2">
          {fabrics.map((fabric) => (
            <button
              key={fabric.key}
              type="button"
              onClick={() => setActiveFabricKey(fabric.key)}
              className={cn(
                "rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors",
                activeFabricKey === fabric.key
                  ? "bg-warka-primary text-white"
                  : "border border-warka-border bg-warka-bg text-warka-text"
              )}
            >
              {locale === "ar" ? fabric.label_ar : fabric.label_en}
            </button>
          ))}
        </div>

        {activeFabric && activeVariant && (
          <div className="space-y-4 rounded-[10px] border border-warka-border bg-warka-bg/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="warka-label">{t("fabricNameAr")}</label>
                <input
                  value={activeFabric.label_ar}
                  onChange={(e) =>
                    updateFabric(activeFabric.key, { label_ar: e.target.value })
                  }
                  className="warka-input"
                />
              </div>
              <div>
                <label className="warka-label">{t("fabricNameEn")}</label>
                <input
                  value={activeFabric.label_en}
                  onChange={(e) =>
                    updateFabric(activeFabric.key, { label_en: e.target.value })
                  }
                  className="warka-input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="warka-label">{t("fabricDescAr")}</label>
                <input
                  value={activeFabric.description_ar ?? ""}
                  onChange={(e) =>
                    updateFabric(activeFabric.key, { description_ar: e.target.value })
                  }
                  className="warka-input"
                />
              </div>
              {activeFabric.key !== "standard" && (
                <div>
                  <label className="warka-label">{t("premiumPriceAdd")}</label>
                  <input
                    type="number"
                    min={0}
                    value={activeFabric.price_adjustment}
                    onChange={(e) =>
                      updateFabric(activeFabric.key, {
                        price_adjustment: Number(e.target.value) || 0,
                      })
                    }
                    className="warka-input"
                  />
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-warka-text">{t("fabricSampleImage")}</p>
              {activeFabric.image && (
                <div className="relative mb-2 aspect-[16/10] max-w-xs overflow-hidden rounded-[10px] border border-warka-border">
                  <Image
                    src={activeFabric.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                </div>
              )}
              <ImageCropUpload
                value={null}
                className="max-w-md"
                label={t("uploadFabricSample")}
                onChange={(dataUrl) =>
                  void handleFabricSampleUpload(activeFabric.key, dataUrl)
                }
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-warka-text">
                {t("fabricColorImages", {
                  fabric: activeFabric.label_ar,
                  color: activeVariant.label_ar,
                })}
              </p>
              {variants.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => setActiveColorKey(v.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-xs",
                        activeColorKey === v.key
                          ? "bg-warka-primary text-white"
                          : "border border-warka-border bg-white"
                      )}
                    >
                      <span
                        className="size-3 rounded-full border border-white/30"
                        style={{ backgroundColor: v.hex }}
                      />
                      {v.label_ar}
                    </button>
                  ))}
                </div>
              )}
              {fabricColorImages.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {fabricColorImages.map((src) => (
                    <div
                      key={src}
                      className="relative size-16 overflow-hidden rounded-[10px] border border-warka-border"
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                      <button
                        type="button"
                        disabled={uploading !== null}
                        onClick={() =>
                          void handleRemoveColorFabricImage(
                            activeVariant.key,
                            activeFabric.key,
                            src
                          )
                        }
                        className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <ImageCropUpload
                value={null}
                className="max-w-md"
                label={t("uploadFabricColorImage")}
                onChange={(dataUrl) =>
                  void handleColorFabricUpload(activeVariant.key, activeFabric.key, dataUrl)
                }
              />
            </div>
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving || uploading !== null || variants.length === 0}
        className="inline-flex items-center gap-2 rounded-[10px] bg-warka-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Plus className="size-4" />
        {saving ? t("saving") : t("saveVariants")}
      </button>
    </div>
  );
}
