import { notFound } from "next/navigation";
import { getBatchById, getBatchStudents } from "@/server/actions/batches";
import { BatchDetailView } from "@/components/features/batches/batch-detail-view";

export default async function AdminBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let batch;
  try {
    batch = await getBatchById(id);
  } catch {
    notFound();
  }

  const students = await getBatchStudents(id);

  return (
      <BatchDetailView
        batch={batch}
        students={students}
        allowCreateAccounts
        isAdmin
      />
  );
}
