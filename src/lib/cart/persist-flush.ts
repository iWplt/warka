/** Cart persist key — must match zustand persist `name` in cart-store. */
export const CART_STORAGE_KEY = "warka-cart-v1";

/** One-shot handoff so Buy Now survives Safari soft-nav before persist rehydrates. */
export const CART_HANDOFF_KEY = "warka-cart-handoff";

type CartPersistShape = {
  state: { items: unknown[] };
  version: number;
};

/**
 * Force-write current cart items to localStorage synchronously.
 * Safari iOS can soft-navigate before zustand's async persist settles.
 */
export function flushCartPersist(items: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CartPersistShape = {
      state: { items: items as unknown[] },
      version: 0,
    };
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    window.sessionStorage.setItem(
      CART_HANDOFF_KEY,
      JSON.stringify({ at: Date.now(), count: Array.isArray(items) ? items.length : 0 })
    );
  } catch {
    // Quota / private mode — session handoff still best-effort
    try {
      window.sessionStorage.setItem(
        CART_HANDOFF_KEY,
        JSON.stringify({ at: Date.now(), count: Array.isArray(items) ? items.length : 0 })
      );
    } catch {
      /* ignore */
    }
  }
}

export function readCartHandoff(): { at: number; count: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CART_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; count?: number };
    if (typeof parsed.at !== "number") return null;
    return { at: parsed.at, count: Number(parsed.count ?? 0) };
  } catch {
    return null;
  }
}

export function clearCartHandoff(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CART_HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}
