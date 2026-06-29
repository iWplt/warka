"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const SPRING = { stiffness: 280, damping: 22, mass: 0.6 };

type FadeUpProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
};

export function FadeUp({
  children,
  className,
}: FadeUpProps) {
  return <div className={className}>{children}</div>;
}

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

/** Scroll-safe wrapper — no opacity/transform animation (prevents scroll flicker). */
export function ScrollReveal({
  children,
  className,
}: ScrollRevealProps) {
  return <div className={cn(className)}>{children}</div>;
}

type RevealStaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
};

export function RevealStagger({
  children,
  className,
}: RevealStaggerProps) {
  return <div className={className}>{children}</div>;
}

export function RevealStaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
};

export function TiltCard({ children, className, maxTilt = 10 }: TiltCardProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, SPRING);
  const springY = useSpring(rotateY, SPRING);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * maxTilt);
    rotateX.set(-py * maxTilt);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX: springX,
        rotateY: springY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}

type MagneticProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
};

export function Magnetic({ children, className, strength = 0.28 }: MagneticProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      className={cn("inline-flex will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}

type ParallaxLayerProps = {
  children: ReactNode;
  className?: string;
  speed?: number;
};

export function ParallaxLayer({ children, className, speed = 0.35 }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !ref.current) return;

    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current;
    const tween = gsap.to(el, {
      y: () => -80 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reducedMotion, speed]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
};

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlight = useTransform(
    [mouseX, mouseY],
    ([x, y]) =>
      `radial-gradient(420px circle at ${x}px ${y}px, rgb(92 98 71 / 0.12), transparent 65%)`
  );

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  if (reducedMotion) {
    return <div className={cn("glass-panel", className)}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn("glass-panel relative overflow-hidden", className)}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: spotlight }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

type FloatingOrbProps = {
  className?: string;
  color?: "purple" | "cyan";
  size?: string;
};

export function FloatingOrb({
  className,
  color = "purple",
  size = "min(40vw, 420px)",
}: FloatingOrbProps) {
  const reducedMotion = useReducedMotion();

  const bg =
    color === "purple"
      ? "rgb(215 203 184 / 0.35)"
      : "rgb(230 225 216 / 0.4)";

  if (reducedMotion) {
    return (
      <div
        className={cn("pointer-events-none absolute rounded-full opacity-40", className)}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${bg} 0%, transparent 70%)`,
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn("pointer-events-none absolute rounded-full opacity-50", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${bg} 0%, transparent 70%)`,
      }}
      aria-hidden
    />
  );
}
