import { notFound } from "next/navigation";
import { getBatchById, getBatchStudents } from "@/server/actions/batches";
import { getPriceCatalog } from "@/server/actions/payments";
import { getProductsCatalog } from "@/server/actions/products";
import {
  GroupOrderWizard,
  type GroupOrderCatalogProduct,
} from "@/components/features/batches/group-order-wizard";
import { toProductDetailDto } from "@/lib/products/variants";
import { GRADUATION_PRODUCT_META } from "@/lib/constants/graduation-products";
import type { ProductType } from "@/types/database";

type PageProps = {
  params: Promise<{ id: string }>;
};

function fallbackImage(type: ProductType): string {
  const meta = GRADUATION_PRODUCT_META.find((m) => m.productType === type);
  return meta?.image ?? "/assets/landing/product-sash.jpg";
}

export default async function RepresentativeGroupOrderPage({ params }: PageProps) {
  const { id } = await params;

  let batch;
  try {
    batch = await getBatchById(id);
  } catch {
    notFound();
  }

  const [students, prices, catalog] = await Promise.all([
    getBatchStudents(id),
    getPriceCatalog(),
    getProductsCatalog(),
  ]);

  const catalogProducts: GroupOrderCatalogProduct[] = catalog.map((product) => {
    const dto = toProductDetailDto(product, fallbackImage);
    return {
      id: product.id,
      product_type: product.product_type,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price: Number(product.price),
      image: dto.image,
      description_ar: product.description_ar,
      description_en: product.description_en,
    };
  });

  return (
    <GroupOrderWizard
      batchId={batch.id}
      batchName={batch.name}
      students={students}
      prices={prices}
      catalogProducts={catalogProducts}
    />
  );
}
