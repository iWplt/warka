import type { CartLineItem } from "@/stores/cart-store";

const WIZARD_STEP_COUNT = 8;

/**
 * Max step the student may open.
 * Deposit step (7) is reachable after review (6).
 * Submit (8) requires depositConfirmed (receipt + method).
 */
export function getMaxAllowedWizardStep(
  items: CartLineItem[],
  options?: {
    hasStudentName?: boolean;
    deliveryComplete?: boolean;
    allSized?: boolean;
    depositConfirmed?: boolean;
  }
): number {
  if (items.length === 0) return 1;

  let max = 2;
  if (options?.hasStudentName && options?.deliveryComplete) max = 3;
  if (max >= 3 && options?.allSized) max = 4;
  if (max >= 4) max = 5; // logo
  if (max >= 5) max = 6; // review
  if (max >= 6) max = 7; // deposit — always after review
  if (max >= 7 && options?.depositConfirmed) max = WIZARD_STEP_COUNT; // submit

  return max;
}

export function clampWizardStep(requested: number, maxAllowed: number): number {
  if (!Number.isFinite(requested) || requested < 1) return 1;
  return Math.min(Math.max(1, Math.floor(requested)), maxAllowed);
}

export function parseStepParam(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

export { WIZARD_STEP_COUNT };
