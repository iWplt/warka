"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, Check } from "lucide-react";
import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { WarkaCard } from "@/components/ui/warka-card";
import { ProductOptionsPicker } from "@/components/features/products/product-options-picker";
import { AddToCartButtons } from "@/components/features/cart/add-to-cart-buttons";
import { formatIqd } from "@/lib/format/currency";
import {
  computeUnitPrice,
  getVariantImages,
  type ProductDetailDto,
} from "@/lib/products/variants";
import { cn } from "@/lib/utils";

type ProductDetailViewProps = {
  product: ProductDetailDto;
};

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const locale = useLocale();

  const colorVariants = product.color_variants;
  const fabricOptions = product.fabric_options;

  const [selectedColorKey, setSelectedColorKey] = useState(colorVariants[0]?.key ?? "");
  const [selectedFabricKey, setSelectedFabricKey] = useState(fabricOptions[0]?.key ?? "standard");
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(
    () => colorVariants.find((v) => v.key === selectedColorKey) ?? colorVariants[0],
    [colorVariants, selectedColorKey]
  );

  const selectedFabric = useMemo(
    () => fabricOptions.find((f) => f.key === selectedFabricKey) ?? fabricOptions[0],
    [fabricOptions, selectedFabricKey]
  );

  const displayImages = useMemo(() => {
    if (!selectedVariant) return product.gallery.length ? product.gallery : [product.image];
    const variantImages = getVariantImages(selectedVariant, selectedFabricKey);
    return variantImages.length > 0 ? variantImages : [product.image];
  }, [selectedVariant, selectedFabricKey, product.gallery, product.image]);

  const [activeImage, setActiveImage] = useState(displayImages[0] ?? product.image);

  useEffect(() => {
    setActiveImage(displayImages[0] ?? product.image);
  }, [displayImages, product.image]);

  const unitPrice = computeUnitPrice(product.price, fabricOptions, selectedFabricKey);
  const lineTotal = unitPrice * quantity;
  const name = locale === "ar" ? product.name_ar : product.name_en;
  const description = locale === "ar" ? product.description_ar : product.description_en;

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
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F5F4F0] shadow-card">
            <Image
              src={activeImage}
              alt={name}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
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

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-warka-text lg:text-3xl">{name}</h1>
            <p className="mt-2 text-xl font-bold text-warka-primary">
              {formatIqd(unitPrice, locale)}
              {selectedFabric && selectedFabric.price_adjustment > 0 && (
                <span className="ms-2 text-sm font-normal text-warka-text-muted">
                  ({locale === "ar" ? selectedFabric.label_ar : selectedFabric.label_en})
                </span>
              )}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-warka-text-secondary">{description}</p>
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

          {colorVariants.length > 0 && (
            <ProductOptionsPicker
              colorVariants={colorVariants}
              fabricOptions={fabricOptions}
              selectedColorKey={selectedColorKey}
              selectedFabricKey={selectedFabricKey}
              onColorChange={setSelectedColorKey}
              onFabricChange={setSelectedFabricKey}
              locale={locale}
            />
          )}

          {colorVariants.length === 0 && fabricOptions.length > 0 && (
            <ProductOptionsPicker
              colorVariants={[]}
              fabricOptions={fabricOptions}
              selectedColorKey=""
              selectedFabricKey={selectedFabricKey}
              onColorChange={() => {}}
              onFabricChange={setSelectedFabricKey}
              locale={locale}
            />
          )}

          <WarkaCard>
            <h2 className="mb-3 text-sm font-semibold text-warka-text">
              {locale === "ar" ? "الكمية" : "Quantity"}
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
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
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="flex size-10 items-center justify-center rounded-xl border border-warka-border text-warka-text hover:bg-warka-bg disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <p className="mt-4 text-lg font-bold text-warka-text">
              {locale === "ar" ? "الإجمالي" : "Total"}: {formatIqd(lineTotal, locale)}
            </p>
          </WarkaCard>

          {product.active ? (
            <AddToCartButtons item={cartItem} />
          ) : (
            <p className="text-center text-sm text-warka-text-muted">
              {locale === "ar" ? "غير متوفر حالياً" : "Currently unavailable"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
