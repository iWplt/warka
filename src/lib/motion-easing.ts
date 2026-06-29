/** Named easing curves — reuse across Motion transitions and CSS */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

export const MOTION_TRANSITION = {
  fast: { duration: 0.35, ease: EASE_OUT_EXPO },
  base: { duration: 0.55, ease: EASE_OUT_EXPO },
  slow: { duration: 0.75, ease: EASE_OUT_SOFT },
} as const;
