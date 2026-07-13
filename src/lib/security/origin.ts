import { headers } from "next/headers";
import { isProductionRuntime } from "@/lib/security/is-production";

/**
 * Allowed origins for mutating Server Actions / API calls.
 * Uses NEXT_PUBLIC_APP_URL plus the current Vercel deployment URL when present.
 */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl) origins.add(appUrl);

  const vercelUrl = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelUrl) {
    origins.add(vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`);
  }

  if (!isProductionRuntime()) {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return [...origins];
}

/**
 * Rejects cross-site mutating requests (CSRF defense-in-depth for Server Actions).
 * Next.js already checks Origin for Server Actions; this enforces an allowlist.
 */
export async function assertSameOriginRequest(): Promise<void> {
  const h = await headers();
  const origin = h.get("origin");
  const referer = h.get("referer");

  // Same-origin navigations / some clients omit Origin; allow when both missing
  // only outside production (e.g. server-to-server tests).
  if (!origin && !referer) {
    if (isProductionRuntime()) {
      throw new Error("Forbidden");
    }
    return;
  }

  const allowed = getAllowedOrigins();
  const candidate = origin ?? (referer ? new URL(referer).origin : null);
  if (!candidate) {
    throw new Error("Forbidden");
  }

  const ok = allowed.some((allowedOrigin) => {
    try {
      return new URL(allowedOrigin).origin === new URL(candidate).origin;
    } catch {
      return allowedOrigin === candidate;
    }
  });

  if (!ok) {
    throw new Error("Forbidden");
  }
}

/** CORS Access-Control-Allow-Origin for public JSON APIs (catalog). */
export function resolveCorsOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  const allowed = getAllowedOrigins();
  try {
    const req = new URL(requestOrigin).origin;
    return allowed.some((a) => {
      try {
        return new URL(a).origin === req;
      } catch {
        return a === req;
      }
    })
      ? req
      : null;
  } catch {
    return null;
  }
}
