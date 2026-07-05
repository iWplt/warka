"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Minus, Plus, Package, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { createOrder } from "@/server/actions/orders";
import { GRADUATION_PRODUCT_META } from "@/lib/constants/graduation-products";
import { validateImageFile } from "@/lib/upload/validate";
import type { PriceCatalogItem, ProductType, Profile } from "@/types/database";
import { cn } from "@/lib/utils";

type StudentOrderFormProps = {
  prices: PriceCatalogItem[];
  profile: Profile | null;
};

export function StudentOrderForm({ prices, profile }: StudentOrderFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const orderT = useTranslations("studentOrder");
  const productT = useTranslations("productType");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState<ProductType>("sash");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const availableProducts = useMemo(
    () =>
      GRADUATION_PRODUCT_META.filter((meta) =>
        prices.some((p) => p.product_type === meta.productType && p.active)
      ),
    [prices]
  );

  const selectedMeta = availableProducts.find((p) => p.productType === productType);
  const unitPrice =
    prices.find((p) => p.product_type === productType)?.base_price ?? 0;
  const lineTotal = Number(unitPrice) * quantity;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeta) {
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
          full_name: profile?.full_name ?? undefined,
          phone: profile?.phone ?? undefined,
          college: profile?.college ?? undefined,
          department: profile?.department ?? undefined,
        },
        items: [
          {
            product_type: productType,
            special_notes: quantity > 1 ? `Quantity: ${quantity}` : undefined,
            unit_price: lineTotal,
          },
        ],
      });

      toast.success(t("common.success"));
      router.push(`/student/orders/${order.id}`);
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

  const summaryBlock = (
    <div className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="relative aspect-[4/5] w-full bg-warka-bg">
        {selectedMeta && (
          <Image
            src={selectedMeta.image}
            alt={productT(productType)}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        )}
      </div>
      <div className="border-t border-warka-border p-5">
        <h2 className="text-lg font-bold text-warka-text">{productT(productType)}</h2>
        <p className="mt-2 text-sm text-warka-text-secondary">{orderT("productPreviewHint")}</p>
        <div className="mt-4 space-y-1 text-sm text-warka-text-secondary">
          <p>
            {orderT("unitPrice")}: {Number(unitPrice).toLocaleString()} IQD
          </p>
          <p>
            {orderT("quantity")}: {quantity}
          </p>
          <p className="text-lg font-bold text-warka-text">
            {t("common.total")}: {lineTotal.toLocaleString()} IQD
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 hidden w-full rounded-xl bg-warka-primary py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark disabled:opacity-60 lg:inline-flex lg:justify-center"
        >
          {loading ? t("common.loading") : orderT("placeOrder")}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="relative pb-28 lg:pb-0">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-6">
        <div>
          <Label className="mb-3 block text-sm font-semibold text-warka-text">{orderT("selectProduct")}</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {availableProducts.map((meta) => {
              const price = prices.find((p) => p.product_type === meta.productType);
              const active = productType === meta.productType;
              return (
                <button
                  key={meta.productType}
                  type="button"
                  onClick={() => setProductType(meta.productType)}
                  className={cn(
                    "rounded-xl border-2 p-4 text-start transition-all",
                    active
                      ? "border-warka-primary bg-warka-primary/5"
                      : "border-warka-border bg-card hover:border-warka-primary/40"
                  )}
                >
                  <p className="font-semibold text-warka-text">{productT(meta.productType)}</p>
                  <p className="mt-1 text-sm text-warka-text-secondary">
                    {Number(price?.base_price ?? 0).toLocaleString()} IQD
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-card">
          <Label className="text-sm font-semibold text-warka-text">{orderT("quantity")}</Label>
          <div className="mt-3 flex items-center gap-3">
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
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-card">
          <Label htmlFor="order-notes" className="text-sm font-semibold text-warka-text">
            {t("orders.specialNotes")}
          </Label>
          <textarea
            id="order-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-warka-border bg-warka-bg px-4 py-3 text-sm text-warka-text focus:border-warka-primary focus:outline-none"
            placeholder={orderT("notesPlaceholder")}
          />
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-card">
          <Label className="text-sm font-semibold text-warka-text">{t("orders.uploadLogo")}</Label>
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
              {locale === "ar" ? "اضغط لرفع الشعار أو اسحب وأفلت" : "Click or drag to upload logo"}
            </span>
            <span className="mt-1 text-xs text-warka-text-muted">PNG, JPG — max 5MB</span>
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
        </div>
      </div>

      <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">{summaryBlock}</div>
      </div>

      <div className="fixed inset-x-0 bottom-above-mobile-nav z-30 border-t border-warka-border bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden md:bottom-0">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <p className="text-xs text-warka-text-muted">{t("common.total")}</p>
            <p className="text-lg font-bold tabular-nums text-warka-text">
              {lineTotal.toLocaleString()} IQD
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-w-[9rem] rounded-xl bg-warka-primary px-6 py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark disabled:opacity-60"
          >
            {loading ? t("common.loading") : orderT("placeOrder")}
          </button>
        </div>
      </div>
    </form>
  );
}
