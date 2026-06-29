import { getAllProductsAdmin, getProductCategories } from "@/server/actions/products";
import { ProductsManager } from "@/components/features/admin/products-manager";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAllProductsAdmin(),
    getProductCategories(),
  ]);
  return <ProductsManager products={products} categories={categories} />;
}
