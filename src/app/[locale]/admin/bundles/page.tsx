import { getAllBundles, getProductsForBundlePicker } from "@/server/actions/bundles";
import { BundlesManager } from "@/components/features/admin/bundles-manager";

export default async function AdminBundlesPage() {
  const [bundles, products] = await Promise.all([getAllBundles(), getProductsForBundlePicker()]);

  return (
    <div className="p-4 sm:p-6">
      <BundlesManager bundles={bundles} products={products} />
    </div>
  );
}
