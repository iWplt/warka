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
        "utility-surface p-6 text-card-foreground",
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
    <h3 className={cn("text-base font-bold text-warka-text", className)} {...props}>
      {children}
    </h3>
  );
}
