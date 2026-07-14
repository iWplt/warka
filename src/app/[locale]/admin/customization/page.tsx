import { redirect } from "next/navigation";
import {
  getAdminCustomizationBundle,
  getAdminCustomizationProducts,
} from "@/server/actions/customization";
import { CustomizationAdminView } from "@/components/features/admin/customization-admin-view";

export default async function AdminCustomizationPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const products = await getAdminCustomizationProducts();
  if (products.length === 0) {
    return (
      <div className="page-description py-8 text-center">
        No active sash/cap/gown products — add products first.
      </div>
    );
  }

  const { product: productParam } = await searchParams;
  const productId = products.find((p) => p.id === productParam)?.id ?? products[0]!.id;
  const data = await getAdminCustomizationBundle(productId);

  return (
    <div className="stack-page">
      <CustomizationAdminView
        products={products}
        initialProductId={productId}
        initialData={data}
      />
    </div>
  );
}
