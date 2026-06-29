"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { EASE_OUT_EXPO } from "@/lib/motion-easing";

type CountUpProps = {
  value: number;
  duration?: number;
  className?: string;
};

export function CountUp({ value, duration = 0.9, className }: CountUpProps) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(() => (reducedMotion ? value : 0));
  const frameRef = useRef<number | null>(null);
  const prevReduced = useRef(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      if (!prevReduced.current) {
        prevReduced.current = true;
      }
      return;
    }

    prevReduced.current = false;
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = cubicBezier(progress, ...EASE_OUT_EXPO);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration, reducedMotion]);

  if (reducedMotion) {
    return <span className={className}>{value.toLocaleString()}</span>;
  }

  return <span className={className}>{display.toLocaleString()}</span>;
}

function cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let start = 0;
  let end = 1;
  for (let i = 0; i < 8; i++) {
    const mid = (start + end) / 2;
    const x = bezierX(mid, x1, x2);
    if (x < t) start = mid;
    else end = mid;
  }
  return bezierY((start + end) / 2, y1, y2);
}

function bezierX(t: number, x1: number, x2: number) {
  return 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
}

function bezierY(t: number, y1: number, y2: number) {
  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
}
