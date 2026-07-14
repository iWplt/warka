"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Scroll-safe wrapper — content stays visible (opacity animations break on mobile Safari). */
export function ScrollReveal({ children, className }: ScrollRevealProps) {
  return <div className={className}>{children}</div>;
}

type ScrollRevealStaggerProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollRevealStagger({ children, className }: ScrollRevealStaggerProps) {
  return <div className={className}>{children}</div>;
}

type ScrollRevealItemProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollRevealItem({ children, className }: ScrollRevealItemProps) {
  return <div className={className}>{children}</div>;
}

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "center" | "start";
};

export function SectionHeading({
  title,
  subtitle,
  className,
  align = "center",
}: SectionHeadingProps) {
  return (
    <ScrollReveal
      className={cn(
        "mb-6 sm:mb-8",
        align === "center" ? "text-center" : "text-start",
        className
      )}
    >
      <h2 className="text-h2 text-warka-text">{title}</h2>
      {subtitle ? (
        <p className="page-description mx-auto mt-2 text-pretty sm:mt-3">{subtitle}</p>
      ) : null}
    </ScrollReveal>
  );
}
