"use client";

import { cn } from "@/lib/utils";

type KineticTextProps = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p" | "span";
};

/** Static headline — no word animation (avoids hydration/scroll flicker). */
export function KineticText({
  text,
  className,
  as: Tag = "h1",
}: KineticTextProps) {
  return <Tag className={cn(className)}>{text}</Tag>;
}
