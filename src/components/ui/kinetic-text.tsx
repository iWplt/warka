"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type KineticTextProps = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p" | "span";
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Word-by-word reveal for hero/section headlines. */
export function KineticText({
  text,
  className,
  as: Tag = "h1",
}: KineticTextProps) {
  const reducedMotion = useReducedMotion();
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (reducedMotion || words.length <= 1) {
    return <Tag className={cn(className)}>{text}</Tag>;
  }

  return (
    <Tag className={cn(className)}>
      {/* Screen readers get the full, natural sentence with real spaces. */}
      <span className="sr-only">{text}</span>
      {/* The animated, per-word version is purely decorative for a11y. */}
      <motion.span
        className="inline"
        aria-hidden="true"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
        }}
      >
        {words.map((word, index) => (
          <motion.span
            key={`${word}-${index}`}
            className="inline-block pe-[0.28em] last:pe-0"
            variants={{
              hidden: { opacity: 0, y: "0.55em" },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.45, ease: EASE_OUT },
              },
            }}
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
