"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

/** Static wrapper — avoids framer-motion SSR/client markup mismatches. */
export function PageTransition({ children, className }: PageTransitionProps) {
  return <div className={cn(className)}>{children}</div>;
}
