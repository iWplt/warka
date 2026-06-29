"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Package, Plus, Trash2 } from "lucide-react";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  uploadProductImage,
} from "@/server/actions/products";
import { PRODUCT_CATEGORY_META } from "@/lib/constants/product-categories";
import type { Product, ProductCategory } from "@/types/database";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ImageCropUpload } from "@/components/ui/image-crop-upload";
import { ProductVariantsPanel } from "@/components/features/admin/product-variants-panel";
import { formatIqd } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

type ProductsManagerProps = {
  products: Product[];
  categories: ProductCategory[];
};

type Draft = {
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: string;
  active: boolean;
  sort_order: string;
};

function emptyDraft(): Draft {
  return {
    slug: "",
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    price: "0",
    active: true,
    sort_order: "0",
  };
}

export function ProductsManager({ products, categories }: ProductsManagerProps) {
  const t = useTranslations("adminProducts");
  const locale = useLocale();
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [activeSection, setActiveSection] = useState(categories[0]?.slug ?? "sash");

  const grouped = useMemo(() => {
    return categories.map((cat) => ({
      category: cat,
      meta: PRODUCT_CATEGORY_META.find((m) => m.slug === cat.slug),
      products: products.filter(
        (p) => p.category_id === cat.id || p.product_type === cat.product_type
      ),
    }));
  }, [categories, products]);

  const handleSave = async (product: Product, form: FormData) => {
    setSaving(product.id);
    try {
      await updateProduct({
        id: product.id,
        category_id: product.category_id ?? categories[0]?.id ?? "",
        product_type: product.product_type,
        slug: String(form.get("slug") ?? product.slug ?? product.id),
        name_ar: String(form.get("name_ar") ?? product.name_ar),
        name_en: String(form.get("name_en") ?? product.name_en),
        description_ar: String(form.get("description_ar") ?? ""),
        description_en: String(form.get("description_en") ?? ""),
        price: Number(form.get("price") ?? product.price),
        active: form.get("active") === "on",
        sort_order: Number(form.get("sort_order") ?? product.sort_order ?? 0),
      });
      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(t("error"));
    } finally {
      setSaving(null);
    }
  };

  const handleCreate = async (category: ProductCategory) => {
    if (!draft.name_ar.trim() || !draft.name_en.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    setSaving(`new-${category.id}`);
    try {
      const slug =
        draft.slug.trim() ||
        `${category.slug}-${Date.now().toString(36)}`;
      const id = await createProduct({
        category_id: category.id,
        product_type: category.product_type,
        slug,
        name_ar: draft.name_ar,
        name_en: draft.name_en,
        description_ar: draft.description_ar || undefined,
        description_en: draft.description_en || undefined,
        price: Number(draft.price) || 0,
        active: draft.active,
        sort_order: Number(draft.sort_order) || 0,
      });
      toast.success(t("created"));
      setAddingCategory(null);
      setDraft(emptyDraft());
      router.refresh();
      return id;
    } catch {
      toast.error(t("error"));
    } finally {
      setSaving(null);
    }
  };

  const handleImage = async (productId: string, dataUrl: string) => {
    setSaving(`img-${productId}`);
    try {
      await uploadProductImage(productId, dataUrl);
      toast.success(t("imageSaved"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm(t("confirmDelete"))) return;
    setSaving(`del-${productId}`);
    try {
      await deleteProduct(productId);
      toast.success(t("deleted"));
      router.refresh();
    } catch {
      toast.error(t("error"));
    } finally {
      setSaving(null);
    }
  };

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={t("empty")}
        description={t("runMigration")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="flex flex-wrap gap-2">
        {grouped.map(({ category }) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveSection(category.slug)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeSection === category.slug
                ? "bg-warka-primary text-white shadow-sm"
                : "border-2 border-warka-border bg-white text-warka-text shadow-sm hover:border-warka-primary/50"
            )}
          >
            {locale === "ar" ? category.name_ar : category.name_en}
          </button>
        ))}
      </div>

      {grouped
        .filter(({ category }) => category.slug === activeSection)
        .map(({ category, meta, products: sectionProducts }) => (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-warka-text">
                  {locale === "ar" ? category.name_ar : category.name_en}
                </h2>
                {meta && (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-warka-text-secondary">
                    {locale === "ar" ? meta.imageGuidelinesAr : meta.imageGuidelinesEn}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddingCategory(category.id);
                  setDraft({
                    ...emptyDraft(),
                    name_ar: category.name_ar,
                    name_en: category.name_en,
                  });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-warka-primary px-4 py-2 text-sm font-semibold text-white hover:bg-warka-primary-dark"
              >
                <Plus className="size-4" />
                {t("addProduct")}
              </button>
            </div>

            {addingCategory === category.id && (
              <WarkaCard>
                <WarkaCardTitle className="mb-4">{t("newProduct")}</WarkaCardTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="warka-label">{t("nameAr")}</label>
                    <input
                      value={draft.name_ar}
                      onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })}
                      className="warka-input"
                    />
                  </div>
                  <div>
                    <label className="warka-label">{t("nameEn")}</label>
                    <input
                      value={draft.name_en}
                      onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                      className="warka-input"
                    />
                  </div>
                  <div>
                    <label className="warka-label">{t("slug")}</label>
                    <input
                      value={draft.slug}
                      onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                      className="warka-input"
                      placeholder="sash-premium"
                    />
                  </div>
                  <div>
                    <label className="warka-label">{t("price")}</label>
                    <input
                      type="number"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      className="warka-input"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCreate(category)}
                    disabled={saving === `new-${category.id}`}
                    className="rounded-xl bg-warka-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {t("create")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingCategory(null)}
                    className="rounded-xl border-2 border-warka-border bg-white px-4 py-2 text-sm font-medium text-warka-text"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </WarkaCard>
            )}

            {sectionProducts.length === 0 ? (
              <EmptyState icon={Package} title={t("sectionEmpty")} />
            ) : (
              <div className="mx-auto grid max-w-3xl gap-6">
                {sectionProducts.map((product) => (
                  <WarkaCard key={product.id}>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <WarkaCardTitle>
                        {locale === "ar" ? product.name_ar : product.name_en}
                      </WarkaCardTitle>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product.id)}
                        className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                        title={t("delete")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {product.image && (
                      <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-warka-bg">
                        <Image
                          src={product.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="400px"
                        />
                      </div>
                    )}

                    <ImageCropUpload
                      value={null}
                      guidelines={
                        meta
                          ? locale === "ar"
                            ? meta.imageGuidelinesAr
                            : meta.imageGuidelinesEn
                          : undefined
                      }
                      onChange={(dataUrl) => void handleImage(product.id, dataUrl)}
                      label={t("uploadImage")}
                    />

                    <ProductVariantsPanel product={product} />

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleSave(product, new FormData(e.currentTarget));
                      }}
                      className="mt-4 space-y-3"
                    >
                      <input type="hidden" name="slug" defaultValue={product.slug ?? ""} />
                      <div>
                        <label className="warka-label">{t("nameAr")}</label>
                        <input name="name_ar" defaultValue={product.name_ar} className="warka-input" />
                      </div>
                      <div>
                        <label className="warka-label">{t("nameEn")}</label>
                        <input name="name_en" defaultValue={product.name_en} className="warka-input" />
                      </div>
                      <div>
                        <label className="warka-label">{t("price")}</label>
                        <input
                          name="price"
                          type="number"
                          min={0}
                          defaultValue={product.price}
                          className="warka-input"
                        />
                        <p className="mt-1.5 text-sm font-medium text-warka-text-secondary">
                          {formatIqd(Number(product.price), locale)}
                        </p>
                      </div>
                      <div>
                        <label className="warka-label">{t("sortOrder")}</label>
                        <input
                          name="sort_order"
                          type="number"
                          min={0}
                          defaultValue={product.sort_order}
                          className="warka-input"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm font-medium text-warka-text">
                        <input name="active" type="checkbox" defaultChecked={product.active} />
                        {t("active")}
                      </label>
                      <button
                        type="submit"
                        disabled={saving === product.id}
                        className="rounded-xl bg-warka-primary px-4 py-2 text-sm font-semibold text-white hover:bg-warka-primary-dark disabled:opacity-60"
                      >
                        {saving === product.id ? t("saving") : t("save")}
                      </button>
                    </form>
                  </WarkaCard>
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
