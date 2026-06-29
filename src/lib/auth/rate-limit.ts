type AttemptEntry = {
  failures: number;
  resetAt: number;
};

const attempts = new Map<string, AttemptEntry>();

const DEFAULT_MAX_FAILURES = 8;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

export function isAuthRateLimited(
  key: string,
  maxFailures = DEFAULT_MAX_FAILURES
): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry) return false;
  if (now > entry.resetAt) {
    attempts.delete(key);
    return false;
  }
  return entry.failures >= maxFailures;
}

export function recordAuthFailure(
  key: string,
  windowMs = DEFAULT_WINDOW_MS
): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { failures: 1, resetAt: now + windowMs });
    return;
  }
  entry.failures += 1;
}

export function clearAuthAttempts(key: string): void {
  attempts.delete(key);
}

export function buildAuthRateLimitKey(identifier: string, ip: string): string {
  return `${ip}:${identifier.trim().toLowerCase()}`;
}
