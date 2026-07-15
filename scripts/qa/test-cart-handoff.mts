/**
 * Focused, dependency-free test for the cart handoff layer (src/lib/cart/persist-flush.ts)
 * and the store dedup contract (src/stores/cart-store.ts → restoreItems).
 *
 * Run:  node node_modules/tsx/dist/cli.mjs scripts/qa/test-cart-handoff.ts
 *
 * No test framework is added on purpose — this uses node:assert and minimal
 * browser-storage shims so it can run in plain Node via tsx.
 */
import assert from "node:assert/strict";

/* ------------------------------------------------------------------ *
 * Browser storage shims (installed BEFORE the modules are imported).
 * ------------------------------------------------------------------ */
class MockStorage {
  private map = new Map<string, string>();
  constructor(private opts: { throwOnSet?: boolean } = {}) {}
  getItem(k: string): string | null {
    return this.map.has(k) ? (this.map.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    if (this.opts.throwOnSet) {
      const err = new Error("quota exceeded") as Error & { name: string };
      err.name = "QuotaExceededError";
      throw err;
    }
    this.map.set(k, String(v));
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
  setThrowOnSet(v: boolean): void {
    this.opts.throwOnSet = v;
  }
  raw(): Map<string, string> {
    return this.map;
  }
}

const localStorageMock = new MockStorage();
const sessionStorageMock = new MockStorage();

// Minimal window with the APIs persist-flush touches.
(globalThis as unknown as { window: unknown }).window = {
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  requestAnimationFrame: (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 0) as unknown as number,
  setTimeout: (fn: () => void, ms?: number) => setTimeout(fn, ms) as unknown as number,
};

/* ------------------------------------------------------------------ *
 * Dynamic imports (after shims exist).
 * ------------------------------------------------------------------ */
const pf = await import("../../src/lib/cart/persist-flush.ts");
const {
  flushCartPersist,
  readCartHandoff,
  clearCartHandoff,
  flushAndNavigate,
  CART_HANDOFF_KEY,
  CART_HANDOFF_VERSION,
  CART_HANDOFF_TTL_MS,
  CART_STORAGE_KEY,
} = pf;

type AnyItem = Record<string, unknown>;

function makeItem(over: Partial<AnyItem> = {}): AnyItem {
  return {
    id: `line-${Math.random().toString(36).slice(2)}`,
    catalogProductId: "prod-1",
    productType: "sash",
    name_ar: "وشاح",
    name_en: "Sash",
    image: "/assets/landing/product-sash.jpg",
    unitPrice: 25000,
    quantity: 2,
    colorKey: "black",
    colorLabel: "أسود",
    colorHex: "#000",
    fabricKey: "standard",
    fabricLabel: "قياسي",
    size: "M",
    customText: "",
    fontFamily: "",
    diacriticsMode: "auto",
    decorationImageDataUrl: "data:image/png;base64,AAAA",
    capSideImageDataUrl: "data:image/png;base64,BBBB",
    capTopImageDataUrl: "data:image/png;base64,CCCC",
    embroideryPosition: "",
    notes: "",
    logoDataUrl: "data:image/png;base64,DDDD",
    customizationPayload: null,
    customized: true,
    ...over,
  };
}

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  \u2713 ${label}`);
}

function reset() {
  clearCartHandoff();
  localStorageMock.raw().clear();
  sessionStorageMock.raw().clear();
  localStorageMock.setThrowOnSet(false);
}

/* ------------------------------------------------------------------ *
 * 1. localStorage.setItem throws QuotaExceededError → full payload in session.
 * ------------------------------------------------------------------ */
{
  reset();
  localStorageMock.setThrowOnSet(true); // simulate Private Mode / quota
  const items = [makeItem({ catalogProductId: "prod-1", quantity: 3 }), makeItem({ catalogProductId: "prod-2", quantity: 1 })];

  // Must NOT throw even though localStorage rejects the write.
  flushCartPersist(items as never);

  const rawSession = sessionStorageMock.getItem(CART_HANDOFF_KEY);
  assert.ok(rawSession, "sessionStorage handoff must be written when localStorage throws");
  const parsed = JSON.parse(rawSession as string);
  assert.equal(parsed.v, CART_HANDOFF_VERSION, "handoff carries schema version");
  assert.equal(parsed.items.length, 2, "full item list persisted (not a count)");
  assert.equal(parsed.items[0].catalogProductId, "prod-1");
  assert.equal(parsed.items[0].quantity, 3, "quantities preserved");
  assert.equal(localStorageMock.getItem(CART_STORAGE_KEY), null, "localStorage stayed empty (write rejected)");
  ok("QuotaExceededError on localStorage → full payload written to sessionStorage");
}

/* ------------------------------------------------------------------ *
 * 2. Restoration: readCartHandoff returns the items.
 * ------------------------------------------------------------------ */
{
  const restored = readCartHandoff();
  assert.ok(restored, "readCartHandoff returns a payload");
  assert.equal(restored!.items.length, 2, "restored 2 items");
  assert.equal(restored!.items[1].catalogProductId, "prod-2");
  ok("readCartHandoff restores the persisted items");
}

/* ------------------------------------------------------------------ *
 * 3. Heavy/base64 fields are stripped (client prices/images not trusted).
 * ------------------------------------------------------------------ */
{
  reset();
  const items = [makeItem()];
  flushCartPersist(items as never);
  const restored = readCartHandoff();
  const it = restored!.items[0] as AnyItem;
  assert.equal(it.logoDataUrl, null, "logoDataUrl stripped");
  assert.equal(it.decorationImageDataUrl, null, "decorationImageDataUrl stripped");
  assert.equal(it.capSideImageDataUrl, null, "capSideImageDataUrl stripped");
  assert.equal(it.capTopImageDataUrl, null, "capTopImageDataUrl stripped");
  // catalogProductId + quantity survive so the server can re-price/re-validate.
  assert.equal(it.catalogProductId, "prod-1");
  assert.equal(typeof it.quantity, "number");
  ok("heavy base64 fields stripped; only server-re-validatable refs kept");
}

/* ------------------------------------------------------------------ *
 * 4. TTL expiry → expired payload rejected.
 * ------------------------------------------------------------------ */
{
  reset();
  const expired = {
    v: CART_HANDOFF_VERSION,
    at: Date.now() - (CART_HANDOFF_TTL_MS + 5_000),
    items: [makeItem()],
  };
  // Write directly to session and ensure no in-memory copy exists.
  clearCartHandoff();
  sessionStorageMock.setItem(CART_HANDOFF_KEY, JSON.stringify(expired));
  const restored = readCartHandoff();
  assert.equal(restored, null, "expired handoff must be rejected");
  ok("expired handoff (TTL) is rejected");
}

/* ------------------------------------------------------------------ *
 * 5. Malformed payloads rejected (bad JSON + wrong shape/version).
 * ------------------------------------------------------------------ */
{
  reset();
  clearCartHandoff();
  sessionStorageMock.setItem(CART_HANDOFF_KEY, "{ this is not valid json");
  assert.equal(readCartHandoff(), null, "invalid JSON rejected");

  clearCartHandoff();
  sessionStorageMock.setItem(
    CART_HANDOFF_KEY,
    JSON.stringify({ v: 999, at: Date.now(), items: [makeItem()] })
  );
  assert.equal(readCartHandoff(), null, "wrong schema version rejected");

  clearCartHandoff();
  sessionStorageMock.setItem(
    CART_HANDOFF_KEY,
    JSON.stringify({ v: CART_HANDOFF_VERSION, at: Date.now(), items: "nope" })
  );
  assert.equal(readCartHandoff(), null, "non-array items rejected");
  ok("malformed handoff payloads are rejected");
}

/* ------------------------------------------------------------------ *
 * 6. Cleanup after consumption.
 * ------------------------------------------------------------------ */
{
  reset();
  flushCartPersist([makeItem()] as never);
  assert.ok(readCartHandoff(), "payload present before cleanup");
  clearCartHandoff();
  assert.equal(sessionStorageMock.getItem(CART_HANDOFF_KEY), null, "session key removed");
  assert.equal(readCartHandoff(), null, "no payload after cleanup (in-memory cleared too)");
  ok("cleanup removes session + in-memory handoff");
}

/* ------------------------------------------------------------------ *
 * 7. flushAndNavigate persists BEFORE navigating.
 * ------------------------------------------------------------------ */
{
  reset();
  const items = [makeItem({ catalogProductId: "prod-nav" })];
  let navigatedWithHandoff = false;
  await new Promise<void>((resolve) => {
    flushAndNavigate(items as never, () => {
      // At navigation time the handoff must already be readable.
      const r = readCartHandoff();
      navigatedWithHandoff = Boolean(r && r.items[0].catalogProductId === "prod-nav");
      resolve();
    });
  });
  assert.equal(navigatedWithHandoff, true, "navigate() only runs after handoff is written");
  ok("flushAndNavigate writes handoff before navigating");
}

/* ------------------------------------------------------------------ *
 * 8. Store dedup: restoreItems never duplicates an already-filled cart.
 * ------------------------------------------------------------------ */
{
  reset();
  const store = await import("../../src/stores/cart-store.ts");
  const { useCartStore } = store;
  useCartStore.getState().clearCart();

  const first = [makeItem({ id: "a" }), makeItem({ id: "b" })];
  useCartStore.getState().restoreItems(first as never);
  assert.equal(useCartStore.getState().items.length, 2, "restore into empty cart works");

  // Zustand cart already has items AND a handoff exists → restore must be a no-op.
  const second = [makeItem({ id: "c" }), makeItem({ id: "d" }), makeItem({ id: "e" })];
  useCartStore.getState().restoreItems(second as never);
  assert.equal(useCartStore.getState().items.length, 2, "restore is a no-op when cart already has items (no duplication)");

  useCartStore.getState().clearCart();
  useCartStore.getState().restoreItems([] as never);
  assert.equal(useCartStore.getState().items.length, 0, "restoring empty list is a no-op");
  ok("store.restoreItems dedups (Zustand cart + handoff never duplicate)");
}

console.log(`\nAll cart-handoff tests passed (${passed} checks).`);
