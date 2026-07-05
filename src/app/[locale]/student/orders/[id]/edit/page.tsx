import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getStudentOrderEditContext } from "@/server/actions/orders";
import { getActiveFonts } from "@/server/actions/fonts";
import { getSizeGuideEntries } from "@/server/actions/settings";
import { getProductTypeLabels } from "@/lib/products/product-type-labels";
import { ActiveFontLoader } from "@/components/features/settings/active-font-loader";
import { StudentOrderEditForm } from "@/components/features/orders/student-order-edit-form";

export default async function StudentOrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let context;
  try {
    context = await getStudentOrderEditContext(id);
  } catch {
    notFound();
  }

  const fonts = await getActiveFonts();
  const locale = (await getLocale()) as "ar" | "en";
  const [sizeGuideEntries, productTypeLabels] = await Promise.all([
    getSizeGuideEntries(),
    getProductTypeLabels(),
  ]);

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
          sizeGuideEntries={sizeGuideEntries}
          sizePolicies={context.sizePolicies}
          locale={locale}
          productTypeLabels={productTypeLabels}
        />
      </div>
    </>
  );
}
