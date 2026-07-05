"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type ConfettiEffectProps = {
  active: boolean;
  durationMs?: number;
};

export function ConfettiEffect({ active, durationMs = 2_500 }: ConfettiEffectProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active || reducedMotion) return;

    const end = Date.now() + durationMs;
    let frameId = 0;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ["#5C5C47", "#F8F7F4", "#D7CBB8", "#25D366"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ["#5C5C47", "#F8F7F4", "#D7CBB8", "#25D366"],
      });

      if (Date.now() < end) {
        frameId = requestAnimationFrame(frame);
      }
    };

    frameId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(frameId);
  }, [active, durationMs, reducedMotion]);

  return null;
}
