"use client";

import type { CartLineItem } from "@/stores/cart-store";

/** Cart persist key — must match zustand persist `name` in cart-store. */
export const CART_STORAGE_KEY = "warka-cart-v1";

/** One-shot handoff so Buy Now / bundle purchase survive Safari/WebKit
 *  soft-nav (and Private Mode localStorage failures) before persist rehydrates. */
export const CART_HANDOFF_KEY = "warka-cart-handoff";

/** Bump when the handoff payload shape changes. */
export const CART_HANDOFF_VERSION = 2;

/** Short, sensible lifetime — a handoff older than this is stale and ignored. */
export const CART_HANDOFF_TTL_MS = 60_000;

type CartPersistShape = {
  state: { items: unknown[] };
  version: number;
};

export type CartHandoffPayload = {
  v: number;
  at: number;
  items: CartLineItem[];
};

/**
 * In-memory fallback that survives client-side soft navigation within the same
 * JS context (SPA transition) even when BOTH localStorage and sessionStorage are
 * unavailable (e.g. locked-down WebKit). Lost on hard reload, which is fine
 * because a hard reload can read localStorage/sessionStorage instead.
 */
let inMemoryHandoff: CartHandoffPayload | null = null;

/** Heavy base64 fields we strip from the handoff to stay within storage quota.
 *  These are re-uploaded/rebuilt in the wizard; the server re-validates anyway. */
const HEAVY_FIELDS: (keyof CartLineItem)[] = [
  "logoDataUrl",
  "decorationImageDataUrl",
  "capSideImageDataUrl",
  "capTopImageDataUrl",
];

function sanitizeItems(items: readonly CartLineItem[]): CartLineItem[] {
  return items.map((item) => {
    const copy = { ...item } as CartLineItem;
    for (const field of HEAVY_FIELDS) {
      // @ts-expect-error narrow assignment of nullable data-url fields
      copy[field] = null;
    }
    return copy;
  });
}

function buildPayload(items: readonly CartLineItem[]): CartHandoffPayload {
  return { v: CART_HANDOFF_VERSION, at: Date.now(), items: sanitizeItems(items) };
}

/**
 * Force-write the current cart to localStorage synchronously AND record a
 * full session/in-memory handoff. Safari iOS can soft-navigate before zustand's
 * async persist settles, and Private Mode can reject localStorage entirely.
 */
export function flushCartPersist(items: readonly CartLineItem[]): void {
  if (typeof window === "undefined") return;

  const payload = buildPayload(items);
  inMemoryHandoff = payload;

  // Primary: mirror zustand persist so a hard reload rehydrates normally.
  try {
    const persistShape: CartPersistShape = { state: { items: [...items] }, version: 0 };
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persistShape));
  } catch {
    /* quota / private mode — fall through to session + in-memory handoff */
  }

  // Fallback handoff: the actual (minimal) cart payload, not just a count.
  try {
    window.sessionStorage.setItem(CART_HANDOFF_KEY, JSON.stringify(payload));
  } catch {
    /* sessionStorage unavailable — in-memory handoff still covers soft-nav */
  }
}

function isValidPayload(value: unknown): value is CartHandoffPayload {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<CartHandoffPayload>;
  return (
    p.v === CART_HANDOFF_VERSION &&
    typeof p.at === "number" &&
    Array.isArray(p.items)
  );
}

/**
 * Read a valid, non-expired handoff payload from sessionStorage, then fall back
 * to the in-memory copy. Returns null when nothing usable exists.
 */
export function readCartHandoff(): CartHandoffPayload | null {
  if (typeof window === "undefined") return null;

  let payload: CartHandoffPayload | null = null;

  try {
    const raw = window.sessionStorage.getItem(CART_HANDOFF_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidPayload(parsed)) payload = parsed;
    }
  } catch {
    /* ignore malformed / unavailable sessionStorage */
  }

  if (!payload && inMemoryHandoff && isValidPayload(inMemoryHandoff)) {
    payload = inMemoryHandoff;
  }

  if (!payload) return null;
  if (Date.now() - payload.at > CART_HANDOFF_TTL_MS) return null; // expired
  if (payload.items.length === 0) return null;

  return payload;
}

export function clearCartHandoff(): void {
  inMemoryHandoff = null;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CART_HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Central helper for every "add then navigate" flow (Buy Now, bundle purchase,
 * cart -> checkout). Adds items, flushes persistence + handoff, then navigates
 * only after the write is observable — never navigates on a bare setState.
 */
export function flushAndNavigate(items: readonly CartLineItem[], navigate: () => void): void {
  flushCartPersist(items);

  const go = () => {
    // Re-flush right before navigation to capture the very latest store state.
    flushCartPersist(items);
    navigate();
  };

  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(go));
  } else if (typeof window !== "undefined") {
    window.setTimeout(go, 0);
  } else {
    go();
  }
}
