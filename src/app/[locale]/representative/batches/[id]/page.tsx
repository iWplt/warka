import { notFound } from "next/navigation";
import { getBatchById, getBatchStudents } from "@/server/actions/batches";
import { getCurrentProfile } from "@/lib/auth/guards";
import { BatchDetailView } from "@/components/features/batches/batch-detail-view";

export default async function RepresentativeBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();

  let batch;
  try {
    batch = await getBatchById(id);
  } catch {
    notFound();
  }

  const students = await getBatchStudents(id);
  const allowCreateAccounts = profile?.role === "representative";

  return (
    <BatchDetailView
      batch={batch}
      students={students}
      allowCreateAccounts={allowCreateAccounts}
    />
  );
}
