export const CART_PULSE_EVENT = "warka:cart-pulse";

export function dispatchCartPulse(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_PULSE_EVENT));
  }
}
