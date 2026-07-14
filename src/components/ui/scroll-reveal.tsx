"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Reveal on scroll — respects prefers-reduced-motion. */
export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

type ScrollRevealStaggerProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollRevealStagger({ children, className }: ScrollRevealStaggerProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -6% 0px" }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.09, delayChildren: 0.04 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

type ScrollRevealItemProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollRevealItem({ children, className }: ScrollRevealItemProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: EASE_OUT },
        },
      }}
    >
      {children}
    </motion.div>
  );
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
