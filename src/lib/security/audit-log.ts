/**
 * Server-only security event logging. Never log passwords, tokens, or PII secrets.
 */

export type SecurityEvent =
  | "auth.login_failed"
  | "auth.rate_limited"
  | "auth.forbidden"
  | "csrf.rejected"
  | "upload.rejected"
  | "cron.unauthorized"
  | "invite.invalid"
  | "permission.denied";

export function logSecurityEvent(
  event: SecurityEvent,
  details: Record<string, string | number | boolean | null | undefined> = {}
): void {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(details)) {
    if (v === undefined) continue;
    const key = k.toLowerCase();
    if (
      key.includes("password") ||
      key.includes("token") ||
      key.includes("secret") ||
      key.includes("authorization")
    ) {
      continue;
    }
    safe[k] = v;
  }

  console.info(
    JSON.stringify({
      type: "security",
      event,
      at: new Date().toISOString(),
      ...safe,
    })
  );
}
