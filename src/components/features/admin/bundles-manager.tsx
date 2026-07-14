"use client";



import { useState } from "react";

import Image from "next/image";

import { useRouter } from "@/i18n/routing";

import { useLocale, useTranslations } from "next-intl";

import { toast } from "sonner";

import { Gift, Plus, Trash2 } from "lucide-react";

import {

  createBundle,

  deleteBundle,

  updateBundle,

  updateBundleItems,

  uploadBundleImage,

} from "@/server/actions/bundles";

import type { Product, ProductBundle } from "@/types/database";

import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";

import { EmptyState } from "@/components/ui/empty-state";

import { PageHeader } from "@/components/ui/page-header";

import { ImageCropUpload } from "@/components/ui/image-crop-upload";

import { BundleSlotPicker } from "@/components/features/bundles/bundle-slot-picker";

import {

  bundleItemsToSlotSelections,

  resolveProductsFromSlots,

  slotSelectionsToItems,

  type BundleSlotSelections,

} from "@/lib/bundles/slots";

import { formatIqd } from "@/lib/format/currency";

import { calculateBundlePricingFromProducts } from "@/lib/bundles/pricing";




type BundlesManagerProps = {

  bundles: ProductBundle[];

  products: Product[];

};



type NewBundleDraft = {

  slug: string;

  name_ar: string;

  name_en: string;

  discount_percent: string;

};



function emptyNewDraft(): NewBundleDraft {

  return { slug: "", name_ar: "", name_en: "", discount_percent: "10" };

}



export function BundlesManager({ bundles, products }: BundlesManagerProps) {

  const t = useTranslations("adminBundles");

  const locale = useLocale();

  const isAr = locale === "ar";

  const router = useRouter();

  const [creating, setCreating] = useState(false);

  const [newDraft, setNewDraft] = useState<NewBundleDraft>(emptyNewDraft());

  const [savingId, setSavingId] = useState<string | null>(null);

  const [slotSelections, setSlotSelections] = useState<Record<string, BundleSlotSelections>>({});



  const getSelections = (bundle: ProductBundle): BundleSlotSelections =>

    slotSelections[bundle.id] ?? bundleItemsToSlotSelections(bundle, products);



  const handleCreate = async () => {

    if (!newDraft.name_ar.trim()) {

      toast.error(t("nameRequired"));

      return;

    }

    setCreating(true);

    try {

      const slug =

        newDraft.slug.trim() ||

        newDraft.name_en.trim().toLowerCase().replace(/\s+/g, "-") ||

        `bundle-${Date.now()}`;

      await createBundle({

        slug,

        name_ar: newDraft.name_ar.trim(),

        name_en: newDraft.name_en.trim() || newDraft.name_ar.trim(),

        discount_percent: Number(newDraft.discount_percent) || 0,

        sort_order: bundles.length,

        is_active: true,

      });

      toast.success(t("created"));

      setNewDraft(emptyNewDraft());

      router.refresh();

    } catch (err) {

      toast.error(err instanceof Error ? err.message : t("error"));

    } finally {

      setCreating(false);

    }

  };



  const handleSaveBundle = async (bundle: ProductBundle, form: FormData) => {

    const selections = getSelections(bundle);

    const items = slotSelectionsToItems(selections);

    if (items.length === 0) {

      toast.error(t("noProductsSelected"));

      return;

    }



    setSavingId(bundle.id);

    try {

      await updateBundle({

        id: bundle.id,

        slug: String(form.get("slug") ?? bundle.slug),

        name_ar: String(form.get("name_ar") ?? bundle.name_ar),

        name_en: String(form.get("name_en") ?? bundle.name_en),

        description_ar: String(form.get("description_ar") ?? "") || undefined,

        description_en: String(form.get("description_en") ?? "") || undefined,

        discount_percent: Number(form.get("discount_percent") ?? bundle.discount_percent),

        sort_order: Number(form.get("sort_order") ?? bundle.sort_order),

        is_active: form.get("is_active") === "on",

      });



      await updateBundleItems({

        bundle_id: bundle.id,

        items,

      });



      toast.success(t("saved"));

      router.refresh();

    } catch (err) {

      toast.error(err instanceof Error ? err.message : t("error"));

    } finally {

      setSavingId(null);

    }

  };



  const handleDelete = async (id: string) => {

    if (!confirm(t("confirmDelete"))) return;

    try {

      await deleteBundle(id);

      toast.success(t("deleted"));

      router.refresh();

    } catch (err) {

      toast.error(err instanceof Error ? err.message : t("error"));

    }

  };



  return (

    <div className="stack-page">

      <PageHeader title={t("title")} description={t("subtitle")} />



      <WarkaCard>

        <WarkaCardTitle className="mb-4 flex items-center gap-2">

          <Plus className="size-4" />

          {t("addBundle")}

        </WarkaCardTitle>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <div>

            <label className="warka-label">{t("nameAr")}</label>

            <input

              className="warka-input"

              value={newDraft.name_ar}

              onChange={(e) => setNewDraft((d) => ({ ...d, name_ar: e.target.value }))}

              placeholder={t("nameArPlaceholder")}

            />

          </div>

          <div>

            <label className="warka-label">{t("nameEn")}</label>

            <input

              className="warka-input"

              value={newDraft.name_en}

              onChange={(e) => setNewDraft((d) => ({ ...d, name_en: e.target.value }))}

            />

          </div>

          <div>

            <label className="warka-label">{t("slug")}</label>

            <input

              className="warka-input"

              dir="ltr"

              value={newDraft.slug}

              onChange={(e) => setNewDraft((d) => ({ ...d, slug: e.target.value }))}

              placeholder="essential"

            />

          </div>

          <div>

            <label className="warka-label">{t("discount")}</label>

            <input

              type="number"

              min={0}

              max={100}

              className="warka-input"

              value={newDraft.discount_percent}

              onChange={(e) => setNewDraft((d) => ({ ...d, discount_percent: e.target.value }))}

            />

          </div>

        </div>

        <button

          type="button"

          disabled={creating}

          onClick={() => void handleCreate()}

          className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-warka-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"

        >

          <Gift className="size-4" />

          {creating ? t("saving") : t("createBundle")}

        </button>

      </WarkaCard>



      {bundles.length === 0 ? (

        <EmptyState icon={Gift} title={t("emptyTitle")} description={t("emptyHint")} />

      ) : (

        bundles.map((bundle) => {

          const selections = getSelections(bundle);

          const bundleProducts = resolveProductsFromSlots(selections, products);

          const pricing = calculateBundlePricingFromProducts(

            bundleProducts,

            bundle.discount_percent

          );



          return (

            <WarkaCard key={bundle.id} className="overflow-hidden">

              <form

                onSubmit={(e) => {

                  e.preventDefault();

                  void handleSaveBundle(bundle, new FormData(e.currentTarget));

                }}

              >

                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-warka-border pb-4">

                  <div className="flex items-center gap-3">

                    <div className="relative size-16 overflow-hidden rounded-xl border border-warka-border bg-warka-bg">

                      {bundle.image ? (

                        <Image src={bundle.image} alt="" fill className="object-cover" sizes="64px" />

                      ) : (

                        <div className="flex size-full items-center justify-center text-warka-primary">

                          <Gift className="size-6" />

                        </div>

                      )}

                    </div>

                    <div>

                      <h3 className="font-bold text-warka-text">{bundle.name_ar}</h3>

                      <p className="text-xs text-warka-text-muted" dir="ltr">

                        /{bundle.slug}

                      </p>

                      <p className="mt-1 text-sm font-semibold text-warka-primary">

                        {formatIqd(pricing.bundlePrice, isAr ? "ar" : "en")}

                        {pricing.discount > 0 && (

                          <span className="ms-2 text-xs font-normal text-warka-text-muted line-through">

                            {formatIqd(pricing.originalPrice, isAr ? "ar" : "en")}

                          </span>

                        )}

                      </p>

                    </div>

                  </div>

                  <label className="flex items-center gap-2 text-sm">

                    <input type="checkbox" name="is_active" defaultChecked={bundle.is_active} />

                    {t("active")}

                  </label>

                </div>



                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                  <div>

                    <label className="warka-label">{t("nameAr")}</label>

                    <input name="name_ar" defaultValue={bundle.name_ar} className="warka-input" />

                  </div>

                  <div>

                    <label className="warka-label">{t("nameEn")}</label>

                    <input name="name_en" defaultValue={bundle.name_en} className="warka-input" />

                  </div>

                  <div>

                    <label className="warka-label">{t("slug")}</label>

                    <input name="slug" defaultValue={bundle.slug} className="warka-input" dir="ltr" />

                  </div>

                  <div>

                    <label className="warka-label">{t("discount")}</label>

                    <input

                      name="discount_percent"

                      type="number"

                      min={0}

                      max={100}

                      defaultValue={bundle.discount_percent}

                      className="warka-input"

                    />

                  </div>

                  <div>

                    <label className="warka-label">{t("sortOrder")}</label>

                    <input

                      name="sort_order"

                      type="number"

                      defaultValue={bundle.sort_order}

                      className="warka-input"

                    />

                  </div>

                </div>



                <div className="mt-4">

                  <p className="mb-2 text-sm font-semibold text-warka-text">{t("bundleImage")}</p>

                  <ImageCropUpload

                    value={bundle.image}

                    className="max-w-md"

                    label={t("uploadImage")}

                    onChange={(dataUrl) =>

                      void uploadBundleImage(bundle.id, dataUrl)

                        .then(() => {

                          toast.success(t("imageSaved"));

                          router.refresh();

                        })

                        .catch((err) =>

                          toast.error(err instanceof Error ? err.message : t("error"))

                        )

                    }

                  />

                </div>



                <div className="mt-5">

                  <p className="mb-1 text-sm font-semibold text-warka-text">{t("pickProducts")}</p>

                  <p className="mb-4 text-xs text-warka-text-muted">{t("pickProductsHint")}</p>

                  <BundleSlotPicker

                    catalog={products}

                    selections={selections}

                    onChange={(next) =>

                      setSlotSelections((prev) => ({ ...prev, [bundle.id]: next }))

                    }

                    locale={isAr ? "ar" : "en"}

                  />

                </div>



                <div className="mt-5 flex flex-wrap gap-2">

                  <button

                    type="submit"

                    disabled={savingId === bundle.id}

                    className="rounded-[10px] bg-warka-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"

                  >

                    {savingId === bundle.id ? t("saving") : t("save")}

                  </button>

                  <button

                    type="button"

                    onClick={() => void handleDelete(bundle.id)}

                    className="inline-flex items-center gap-1 rounded-[10px] border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"

                  >

                    <Trash2 className="size-3.5" />

                    {t("delete")}

                  </button>

                </div>

              </form>

            </WarkaCard>

          );

        })

      )}

    </div>

  );

}


