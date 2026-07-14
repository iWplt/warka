import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-warka-border bg-card px-5 py-12 text-center shadow-card sm:px-6 sm:py-14",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-warka-bg sm:size-12">
          <Icon className="size-5 text-warka-primary sm:size-6" aria-hidden />
        </div>
      )}
      <p className="section-title">{title}</p>
      {description && (
        <p className="page-description mt-2 text-center">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
