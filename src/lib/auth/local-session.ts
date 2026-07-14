import type { Profile, UserRole } from "@/types/database";
import { isProductionRuntime } from "@/lib/security/is-production";

export const LOCAL_SESSION_COOKIE = "local_ems_session";

/** Session lifetime: 8 hours (was 7 days). */
export const LOCAL_SESSION_MAX_AGE_SEC = 60 * 60 * 8;

export type LocalSessionPayload = {
  sub: string;
  role: UserRole;
  full_name: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.LOCAL_AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (isProductionRuntime()) {
    throw new Error("LOCAL_AUTH_SECRET must be set in production (min 16 chars)");
  }

  return "local-dev-secret-do-not-use-in-production";
}

function getLocalUsername(): string {
  const user = process.env.LOCAL_ADMIN_USERNAME;
  if (user) return user;
  if (isProductionRuntime()) {
    throw new Error("LOCAL_ADMIN_USERNAME must be set when local auth is enabled in production");
  }
  return "admin";
}

function getLocalPassword(): string {
  const pass = process.env.LOCAL_ADMIN_PASSWORD;
  if (pass && pass.length >= 8) return pass;
  if (isProductionRuntime()) {
    throw new Error("LOCAL_ADMIN_PASSWORD must be set (min 8 chars) when local auth is enabled in production");
  }
  return "admin123";
}

export function isLocalAuthEnabled(): boolean {
  return process.env.LOCAL_AUTH_ENABLED === "true";
}

export function validateLocalCredentials(
  username: string,
  password: string
): boolean {
  const expectedUser = getLocalUsername();
  const expectedPass = getLocalPassword();
  return username === expectedUser && password === expectedPass;
}

export function buildLocalAdminProfile(name?: string): Profile {
  const now = new Date().toISOString();
  return {
    id: "local-admin",
    role: "admin",
    full_name: name ?? getLocalUsername(),
    email: null,
    phone: null,
    college: null,
    department: null,
    stage: null,
    class_name: null,
    graduation_year: null,
    access_code: null,
    student_id_number: null,
    is_active: true,
    locale: "ar",
    created_at: now,
    updated_at: now,
  };
}

async function hmacSign(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(signature).toString("base64url");
}

async function hmacVerify(data: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(data);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createLocalSessionToken(
  payload: Omit<LocalSessionPayload, "exp"> & { exp?: number }
): Promise<string> {
  const body: LocalSessionPayload = {
    ...payload,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + LOCAL_SESSION_MAX_AGE_SEC,
  };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = await hmacSign(data);
  return `${data}.${sig}`;
}

export async function parseLocalSessionToken(
  token: string | undefined
): Promise<LocalSessionPayload | null> {
  if (!token) return null;

  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  const valid = await hmacVerify(data, sig);
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as LocalSessionPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function localSessionToProfile(session: LocalSessionPayload): Profile {
  return buildLocalAdminProfile(session.full_name);
}
