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
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warka-border bg-card px-6 py-14 text-center shadow-card",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-warka-bg">
          <Icon className="size-6 text-warka-primary" aria-hidden />
        </div>
      )}
      <p className="text-base font-semibold text-warka-text">{title}</p>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-warka-text-secondary">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
