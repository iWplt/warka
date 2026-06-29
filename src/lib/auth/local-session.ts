import type { Profile, UserRole } from "@/types/database";

export const LOCAL_SESSION_COOKIE = "local_ems_session";

export type LocalSessionPayload = {
  sub: string;
  role: UserRole;
  full_name: string;
  exp: number;
};

function getSecret(): string {
  return process.env.LOCAL_AUTH_SECRET ?? "local-dev-secret-do-not-use-in-production";
}

function getLocalUsername(): string {
  return process.env.LOCAL_ADMIN_USERNAME ?? "admin";
}

function getLocalPassword(): string {
  return process.env.LOCAL_ADMIN_PASSWORD ?? "admin123";
}

export function isLocalAuthEnabled(): boolean {
  if (process.env.LOCAL_AUTH_ENABLED === "true") return true;
  if (process.env.LOCAL_AUTH_ENABLED === "false") return false;
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return !hasSupabase;
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
  return expected === signature;
}

export async function createLocalSessionToken(
  payload: Omit<LocalSessionPayload, "exp"> & { exp?: number }
): Promise<string> {
  const body: LocalSessionPayload = {
    ...payload,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
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
