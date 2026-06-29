import { notFound } from "next/navigation";
import { getBatchById, getBatchStudents } from "@/server/actions/batches";
import { getPriceCatalog } from "@/server/actions/payments";
import { GroupOrderWizard } from "@/components/features/batches/group-order-wizard";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RepresentativeGroupOrderPage({ params }: PageProps) {
  const { id } = await params;

  let batch;
  try {
    batch = await getBatchById(id);
  } catch {
    notFound();
  }

  const [students, prices] = await Promise.all([
    getBatchStudents(id),
    getPriceCatalog(),
  ]);

  return (
    <GroupOrderWizard
      batchId={batch.id}
      batchName={batch.name}
      students={students}
      prices={prices}
    />
  );
}
