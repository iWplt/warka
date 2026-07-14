"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Minus, Plus, Check } from "lucide-react";
import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { WarkaCard } from "@/components/ui/warka-card";
import { ProductOptionsPicker } from "@/components/features/products/product-options-picker";
import { EmbroideryPositionsPicker } from "@/components/features/products/embroidery-positions-picker";
import { InlineSizeGuide } from "@/components/features/products/inline-size-guide";
import { AddToCartButtons } from "@/components/features/cart/add-to-cart-buttons";
import {
  ProductDetailExtras,
  useAddToCartAnchor,
} from "@/components/features/products/product-detail-extras";
import { formatIqd } from "@/lib/format/currency";
import {
  getSizeOptionsFromGuide,
  productNeedsSizeFromGuide,
} from "@/lib/cart/sizes";
import {
  computeUnitPrice,
  getVariantImages,
  type ProductDetailDto,
} from "@/lib/products/variants";
import { FontPickerTrigger } from "@/components/features/embroidery/font-picker-popup";
import { DecorationUploadField } from "@/components/features/embroidery/decoration-upload-field";
import { findFontByFamily, fontDisplayName } from "@/lib/constants/arabic-font-presets";
import { NameDiacriticsControls } from "@/components/features/embroidery/name-diacritics-controls";
import { EmbroideryLivePreview } from "@/components/features/embroidery/embroidery-live-preview";
import type { ProductCustomizationProfile } from "@/types/customization";
import {
  CustomizationStudioModal,
  CustomizationStudioTrigger,
} from "@/components/features/customization/customization-studio-modal";
import { CustomizationVisualPreview } from "@/components/features/customization/customization-visual-preview";
import {
  applyPrimaryNameToPayload,
  primaryNameFromPayload,
  profileHasEngine,
  zonesForStyle,
} from "@/lib/customization/engine";
import type { CustomizationPayload } from "@/types/customization";
import { resolveEmbroideryDisplayName, type DiacriticsMode } from "@/lib/arabic/harakat";
import type { SizeGuideEntry, WarkaFont } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

type ProductDetailViewProps = {
  product: ProductDetailDto;
  productPageUrl?: string;
  sizeGuideEntries?: SizeGuideEntry[];
  fonts?: WarkaFont[];
  customizationProfile?: ProductCustomizationProfile | null;
};

export function ProductDetailView({
  product,
  productPageUrl,
  sizeGuideEntries = [],
  fonts = [],
  customizationProfile = null,
}: ProductDetailViewProps) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const addToCartRef = useAddToCartAnchor();

  const colorVariants = product.color_variants;
  const fabricOptions = product.fabric_options;
  const embroideryPositions = product.embroidery_positions ?? [];

  const [selectedColorKey, setSelectedColorKey] = useState(colorVariants[0]?.key ?? "");
  const [selectedFabricKey, setSelectedFabricKey] = useState(fabricOptions[0]?.key ?? "standard");
  const [selectedSize, setSelectedSize] = useState("");
  const [customMeasurements, setCustomMeasurements] = useState("");
  const [studentName, setStudentName] = useState("");
  const [selectedFont, setSelectedFont] = useState<string | null>(null);
  const [diacriticsMode, setDiacriticsMode] = useState<DiacriticsMode>("auto");
  const [decorationImageDataUrl, setDecorationImageDataUrl] = useState<string | null>(null);
  const [capSideImage, setCapSideImage] = useState<string | null>(null);
  const [capTopImage, setCapTopImage] = useState<string | null>(null);
  const [customReferenceImage, setCustomReferenceImage] = useState<string | null>(null);
  const usesEngine = profileHasEngine(customizationProfile);
  const [customization, setCustomization] = useState<CustomizationPayload>(() => ({
    style_id: customizationProfile?.styles[0]?.id ?? null,
    style_key: customizationProfile?.styles[0]?.style_key,
    style_name_ar: customizationProfile?.styles[0]?.style_name_ar,
    zones: [],
    gown_additions: [],
  }));
  const [selectedEmbroidery, setSelectedEmbroidery] = useState(
    embroideryPositions[0]?.key ?? ""
  );
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [studioOpen, setStudioOpen] = useState(false);

  const needsSize = productNeedsSizeFromGuide(sizeGuideEntries, product.product_type);
  const sizeIsComplete = Boolean(selectedSize.trim() || customMeasurements.trim());
  const sizeOptions = getSizeOptionsFromGuide(
    sizeGuideEntries,
    product.product_type,
    locale === "ar" ? "ar" : "en"
  );
  const scopedSizeGuide = sizeGuideEntries.filter(
    (e) => e.product_type === product.product_type || !e.product_type
  );

  const selectedVariant = useMemo(
    () => colorVariants.find((v) => v.key === selectedColorKey) ?? colorVariants[0],
    [colorVariants, selectedColorKey]
  );

  const selectedFabric = useMemo(
    () => fabricOptions.find((f) => f.key === selectedFabricKey) ?? fabricOptions[0],
    [fabricOptions, selectedFabricKey]
  );

  const displayImages = useMemo(() => {
    const fromGallery = product.gallery.length > 0 ? product.gallery : [];
    if (!selectedVariant) {
      return fromGallery.length ? fromGallery : [product.image];
    }
    const variantImages = getVariantImages(selectedVariant, selectedFabricKey);
    const merged = [...new Set([...variantImages, ...fromGallery])].filter(Boolean);
    return merged.length > 0 ? merged : [product.image];
  }, [selectedVariant, selectedFabricKey, product.gallery, product.image]);

  const [activeImage, setActiveImage] = useState(displayImages[0] ?? product.image);

  useEffect(() => {
    setActiveImage(displayImages[0] ?? product.image);
  }, [displayImages, product.image]);

  useEffect(() => {
    if (searchParams.get("buy") !== "1") return;
    addToCartRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchParams, addToCartRef]);

  const unitPrice = computeUnitPrice(product.price, fabricOptions, selectedFabricKey);
  const lineTotal = unitPrice * quantity;
  const name = locale === "ar" ? product.name_ar : product.name_en;
  const description = locale === "ar" ? product.description_ar : product.description_en;

  const engineName = primaryNameFromPayload(customization);
  const displayName = usesEngine
    ? engineName || resolveEmbroideryDisplayName(studentName, diacriticsMode)
    : resolveEmbroideryDisplayName(studentName, diacriticsMode);
  const activeStyleKey = customizationProfile?.styles.find((s) => s.id === customization.style_id)?.style_key;
  const activeStyleLabel = customizationProfile?.styles.find((s) => s.id === customization.style_id);
  const engineZones = useMemo(
    () =>
      customizationProfile
        ? zonesForStyle(customizationProfile.zones, customization.style_id ?? null)
        : [],
    [customizationProfile, customization.style_id]
  );
  const zonesFilled = customization.zones.filter(
    (z) => z.text_value?.trim() || z.option_id || z.image_data_url
  ).length;
  const selectedFontMeta = selectedFont ? findFontByFamily(fonts, selectedFont) : null;

  const handleStudentNameChange = (name: string) => {
    setStudentName(name);
    if (usesEngine && customizationProfile) {
      const embroidered = resolveEmbroideryDisplayName(name, diacriticsMode);
      setCustomization((prev) =>
        applyPrimaryNameToPayload(prev, customizationProfile, embroidered)
      );
    }
  };

  const handleDiacriticsModeChange = (mode: DiacriticsMode) => {
    setDiacriticsMode(mode);
    if (usesEngine && customizationProfile && studentName.trim()) {
      const embroidered = resolveEmbroideryDisplayName(studentName, mode);
      setCustomization((prev) =>
        applyPrimaryNameToPayload(prev, customizationProfile, embroidered)
      );
    }
  };

  const handleCustomizationChange = (payload: CustomizationPayload) => {
    setCustomization(payload);
    const fromEngine = primaryNameFromPayload(payload);
    if (fromEngine && fromEngine !== studentName.trim()) {
      setStudentName(fromEngine);
    }
  };

  const cartItem = {
    catalogProductId: product.id,
    productType: product.product_type,
    name_ar: product.name_ar,
    name_en: product.name_en,
    image: activeImage,
    unitPrice,
    quantity,
    colorKey: selectedVariant?.key ?? "",
    colorLabel: selectedVariant
      ? locale === "ar"
        ? selectedVariant.label_ar
        : selectedVariant.label_en
      : product.colors[0] ?? "",
    colorHex: selectedVariant?.hex ?? "#cccccc",
    fabricKey: selectedFabricKey,
    fabricLabel: selectedFabric
      ? locale === "ar"
        ? selectedFabric.label_ar
        : selectedFabric.label_en
      : "",
    size: selectedSize,
    notes: customMeasurements.trim()
      ? locale === "ar"
        ? `قياسات: ${customMeasurements.trim()}`
        : `Measurements: ${customMeasurements.trim()}`
      : "",
    customText: usesEngine ? engineName || studentName : studentName,
    fontFamily: selectedFont ?? "",
    diacriticsMode,
    decorationImageDataUrl,
    capSideImageDataUrl: capSideImage,
    capTopImageDataUrl: capTopImage,
    embroideryPosition: selectedEmbroidery,
    customizationPayload: usesEngine ? customization : null,
  };

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className={cn("space-y-4", usesEngine && "max-lg:space-y-3")}>
          {usesEngine && customizationProfile ? (
            <>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-warka-bg shadow-card lg:hidden">
                <Image
                  src={activeImage}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              </div>
              <div className="hidden lg:block lg:sticky lg:top-20">
                <CustomizationVisualPreview
                  baseImage={activeImage}
                  productType={product.product_type}
                  profile={customizationProfile}
                  customization={customization}
                  sashColorHex={selectedVariant?.hex ?? null}
                  fontFamily={selectedFont ?? "Cairo, sans-serif"}
                  locale={locale === "ar" ? "ar" : "en"}
                />
              </div>
            </>
          ) : (
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-warka-bg shadow-card lg:sticky lg:top-20">
            <Image
              src={activeImage}
              alt={name}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          )}
          {displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {displayImages.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(src)}
                  className={cn(
                    "relative size-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                    activeImage === src
                      ? "border-warka-primary"
                      : "border-warka-border hover:border-warka-primary/40"
                  )}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="page-title">{name}</h1>
            <p className="text-price mt-2 text-xl text-warka-primary">
              {formatIqd(unitPrice, locale)}
              {selectedFabric && selectedFabric.price_adjustment > 0 && (
                <span className="ms-2 text-sm font-normal text-warka-text-muted">
                  ({locale === "ar" ? selectedFabric.label_ar : selectedFabric.label_en})
                </span>
              )}
            </p>
            <p className="page-description mt-4">{description}</p>
          </div>

          {product.features.length > 0 && (
            <WarkaCard>
              <h2 className="mb-3 text-sm font-semibold text-warka-text">
                {locale === "ar" ? "المميزات" : "Features"}
              </h2>
              <ul className="space-y-2">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-warka-text-secondary"
                  >
                    <Check className="size-4 shrink-0 text-warka-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </WarkaCard>
          )}

          {(colorVariants.length > 0 || fabricOptions.length > 0) && (
            <ProductOptionsPicker
              colorVariants={colorVariants}
              fabricOptions={fabricOptions}
              selectedColorKey={selectedColorKey}
              selectedFabricKey={selectedFabricKey}
              onColorChange={setSelectedColorKey}
              onFabricChange={setSelectedFabricKey}
              locale={locale}
              productType={product.product_type}
              selectedSize={selectedSize}
              onSizeChange={needsSize ? setSelectedSize : undefined}
              sizeOptions={sizeOptions}
              hideSizeSection={needsSize}
              onOpenSizeGuide={
                needsSize ? () => setSizeGuideOpen(true) : undefined
              }
            />
          )}

          {needsSize && (
            <InlineSizeGuide
              entries={scopedSizeGuide}
              productType={product.product_type}
              locale={locale === "ar" ? "ar" : "en"}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              sizeOptions={sizeOptions}
              customMeasurements={customMeasurements}
              onCustomMeasurementsChange={setCustomMeasurements}
            />
          )}

          {usesEngine && customizationProfile && (
            <>
              <CustomizationStudioTrigger
                locale={locale === "ar" ? "ar" : "en"}
                onClick={() => setStudioOpen(true)}
                styleLabel={
                  activeStyleLabel
                    ? locale === "ar"
                      ? activeStyleLabel.style_name_ar
                      : activeStyleLabel.style_name_en ?? activeStyleLabel.style_name_ar
                    : null
                }
                fontLabel={
                  selectedFontMeta
                    ? fontDisplayName(selectedFontMeta, locale === "ar" ? "ar" : "en")
                    : null
                }
                zonesFilled={zonesFilled}
                zonesTotal={engineZones.length}
                thumbnailUrl={activeImage}
              />
              <CustomizationStudioModal
                open={studioOpen}
                onOpenChange={setStudioOpen}
                locale={locale === "ar" ? "ar" : "en"}
                productType={product.product_type}
                baseImage={activeImage}
                profile={customizationProfile}
                customization={customization}
                onCustomizationChange={handleCustomizationChange}
                sashColorHex={selectedVariant?.hex ?? null}
                fonts={fonts}
                selectedFont={selectedFont}
                onFontChange={setSelectedFont}
                displayName={displayName}
                decorationUrl={decorationImageDataUrl}
                onDecorationChange={setDecorationImageDataUrl}
                capSideUrl={capSideImage}
                capTopUrl={capTopImage}
                onCapSideChange={setCapSideImage}
                onCapTopChange={setCapTopImage}
                showCustomReference={activeStyleKey === "custom_image"}
                customReferenceUrl={customReferenceImage}
                onCustomReferenceChange={setCustomReferenceImage}
              />
            </>
          )}

          {!usesEngine && embroideryPositions.length > 0 && (
            <EmbroideryPositionsPicker
              positions={embroideryPositions}
              selectedKey={selectedEmbroidery}
              onChange={setSelectedEmbroidery}
              locale={locale === "ar" ? "ar" : "en"}
            />
          )}

          <WarkaCard className="overflow-hidden p-0">
            <div className="border-b border-warka-border/50 bg-warka-primary/5 px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="section-title">
                {locale === "ar" ? "الاسم والتطريز" : "Name & embroidery"}
              </h2>
              <p className="mt-1 text-xs text-warka-text-muted">
                {locale === "ar"
                  ? usesEngine
                    ? "اكتب اسمك هنا مباشرة — الشكل والنقشات من استوديو التخصيص أعلاه."
                    : "اكتب اسمك، اختر الخط، وشوف المعاينة — ثم حدّد الكمية."
                  : usesEngine
                    ? "Enter your name here — styles and patterns are in the studio above."
                    : "Enter your name, pick a font, preview — then set quantity."}
              </p>
            </div>

            <div className="space-y-0 divide-y divide-warka-border/40">
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <NameDiacriticsControls
                  baseName={studentName}
                  mode={diacriticsMode}
                  onBaseNameChange={handleStudentNameChange}
                  onModeChange={handleDiacriticsModeChange}
                  locale={locale === "ar" ? "ar" : "en"}
                />
              </div>

              {!usesEngine && (
                <div className="bg-warka-bg/30 px-4 py-4 sm:px-6 sm:py-5">
                  <DecorationUploadField
                    imageUrl={decorationImageDataUrl}
                    onChange={setDecorationImageDataUrl}
                    locale={locale === "ar" ? "ar" : "en"}
                  />
                </div>
              )}

              {fonts.length > 0 && (
                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <p className="mb-3 text-sm font-semibold text-warka-text">
                    {locale === "ar" ? "اختيار الخط" : "Font selection"}
                  </p>
                  <FontPickerTrigger
                    fonts={fonts}
                    previewText={displayName}
                    selectedFontFamily={selectedFont}
                    onConfirm={setSelectedFont}
                    locale={locale === "ar" ? "ar" : "en"}
                    required
                  />
                  {selectedFont && findFontByFamily(fonts, selectedFont) && (
                    <p className="mt-2 text-center text-xs text-warka-text-muted">
                      {locale === "ar" ? "الخط المختار:" : "Selected:"}{" "}
                      {fontDisplayName(findFontByFamily(fonts, selectedFont)!, locale === "ar" ? "ar" : "en")}
                    </p>
                  )}
                </div>
              )}

              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <EmbroideryLivePreview
                  baseName={studentName}
                  diacriticsMode={diacriticsMode}
                  fontFamily={selectedFont}
                  fonts={fonts}
                  locale={locale === "ar" ? "ar" : "en"}
                  embedded
                />
              </div>
            </div>
          </WarkaCard>

          <WarkaCard className="p-4 sm:p-6">
            <h2 className="mb-3 text-sm font-semibold text-warka-text">
              {locale === "ar" ? "الكمية" : "Quantity"}
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex size-11 touch-manipulation items-center justify-center rounded-xl border border-warka-border text-warka-text transition-colors hover:border-warka-primary/40 hover:bg-warka-bg disabled:opacity-40 sm:size-10"
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
                className="w-20 border-warka-border text-center text-base"
              />
              <button
                type="button"
                disabled={quantity >= 99}
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="flex size-11 touch-manipulation items-center justify-center rounded-xl border border-warka-border text-warka-text transition-colors hover:border-warka-primary/40 hover:bg-warka-bg disabled:opacity-40 sm:size-10"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <p className="mt-4 text-lg font-bold text-warka-primary">
              {locale === "ar" ? "الإجمالي" : "Total"}: {formatIqd(lineTotal, locale)}
            </p>
          </WarkaCard>

          {product.active ? (
            <div ref={addToCartRef}>
              <AddToCartButtons
                item={cartItem}
                requiresSize={needsSize}
                selectedSize={selectedSize}
                customMeasurements={customMeasurements}
                sizeIsComplete={sizeIsComplete}
              />
            </div>
          ) : (
            <p className="text-center text-sm text-warka-text-muted">
              {locale === "ar" ? "غير متوفر حالياً" : "Currently unavailable"}
            </p>
          )}

          {product.active && (
            <ProductDetailExtras
              productName={name}
              productUrl={productPageUrl ?? `/products/${product.id}`}
              unitPrice={unitPrice}
              cartItem={cartItem}
              addToCartRef={addToCartRef}
              requiresSize={needsSize}
              selectedSize={selectedSize}
              sizeIsComplete={sizeIsComplete}
              customMeasurements={customMeasurements}
              sizeGuideOpen={sizeGuideOpen}
              onSizeGuideOpenChange={setSizeGuideOpen}
              sizeGuideEntries={scopedSizeGuide}
              productType={product.product_type}
              onSelectSize={setSelectedSize}
            />
          )}
        </div>
      </div>
    </div>
  );
}
