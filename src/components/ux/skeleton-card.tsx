import { cn } from "@/lib/utils";

type SkeletonCardProps = {
  className?: string;
  lines?: number;
  showHeader?: boolean;
};

export function SkeletonCard({
  className,
  lines = 3,
  showHeader = true,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-warka-border bg-card p-5 shadow-card",
        className
      )}
    >
      {showHeader ? (
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-skeleton" />
            <div className="h-3 w-1/3 animate-pulse rounded-md bg-skeleton" />
          </div>
        </div>
      ) : null}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-3 animate-pulse rounded-md bg-skeleton",
              index === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  );
}
