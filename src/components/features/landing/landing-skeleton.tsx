import { Skeleton } from "@/components/ui/skeleton";

export function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-warka-bg">
      <Skeleton className="mx-auto h-[520px] max-w-7xl rounded-none sm:mx-6 sm:rounded-2xl lg:mx-8" />
      <div className="mx-auto mt-8 grid max-w-7xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
