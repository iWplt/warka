import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  glow?: boolean;
  as?: "div" | "section" | "article" | "aside";
};

export function GlassPanel({
  children,
  className,
  strong = false,
  glow = false,
  as: Tag = "div",
}: GlassPanelProps) {
  return (
    <Tag
      className={cn(
        strong ? "glass-panel-strong" : "glass-panel",
        glow && "glow-ring",
        className
      )}
    >
      {children}
    </Tag>
  );
}
