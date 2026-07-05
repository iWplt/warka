import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-3 py-6 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-4 w-64 rounded-md" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4 rounded-lg" />
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
