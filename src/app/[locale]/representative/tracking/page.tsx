import { getBatches, getBatchTrackingSummary } from "@/server/actions/batches";
import { BatchTrackingView } from "@/components/features/batches/batch-tracking-view";

type PageProps = {
  searchParams: Promise<{ batchId?: string }>;
};

export default async function RepresentativeTrackingPage({ searchParams }: PageProps) {
  const { batchId } = await searchParams;
  const batches = await getBatches();
  const selectedBatchId = batchId ?? batches[0]?.id ?? "";
  const summary = selectedBatchId
    ? await getBatchTrackingSummary(selectedBatchId)
    : null;

  return (
    <BatchTrackingView
      batches={batches}
      selectedBatchId={selectedBatchId}
      summary={summary}
    />
  );
}
