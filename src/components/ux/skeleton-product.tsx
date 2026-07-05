import { cn } from "@/lib/utils";

type SkeletonProductProps = {
  className?: string;
};

export function SkeletonProduct({ className }: SkeletonProductProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-warka-border bg-card shadow-card",
        className
      )}
    >
      <div className="aspect-[4/3] animate-pulse bg-skeleton" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-20 animate-pulse rounded-md bg-skeleton" />
        <div className="h-5 w-3/4 animate-pulse rounded-md bg-skeleton" />
        <div className="h-4 w-24 animate-pulse rounded-md bg-skeleton" />
        <div className="flex gap-2 pt-1">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-skeleton" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-skeleton" />
        </div>
      </div>
    </div>
  );
}
