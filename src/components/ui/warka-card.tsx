import * as React from "react";
import { cn } from "@/lib/utils";

export function WarkaCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-warka-border bg-card p-4 text-card-foreground shadow-card sm:p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function WarkaCardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("section-title", className)} {...props}>
      {children}
    </h3>
  );
}
