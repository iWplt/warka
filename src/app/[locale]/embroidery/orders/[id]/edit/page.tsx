import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getEmbroideryOrderEditContext } from "@/server/actions/orders";
import { getActiveFonts } from "@/server/actions/fonts";
import { getProductTypeLabels } from "@/lib/products/product-type-labels";
import { ActiveFontLoader } from "@/components/features/settings/active-font-loader";
import { StudentOrderEditForm } from "@/components/features/orders/student-order-edit-form";

export default async function EmbroideryOrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let context;
  try {
    context = await getEmbroideryOrderEditContext(id);
  } catch {
    notFound();
  }

  const fonts = await getActiveFonts();
  const locale = (await getLocale()) as "ar" | "en";
  const productTypeLabels = await getProductTypeLabels();

  return (
    <>
      <ActiveFontLoader />
      <div className="px-4 py-6 sm:px-6">
        <StudentOrderEditForm
          order={context.order}
          items={context.items}
          canEdit={context.canEdit}
          fonts={fonts}
          itemMedia={context.itemMedia}
          embroideryPositionsByType={context.embroideryPositionsByType}
          sizeGuideEntries={[]}
          sizePolicies={context.sizePolicies}
          locale={locale}
          productTypeLabels={productTypeLabels}
          editorRole="embroidery"
        />
      </div>
    </>
  );
}
