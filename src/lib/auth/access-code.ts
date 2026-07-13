import { createHmac, randomInt } from "crypto";
import { isProductionRuntime } from "@/lib/security/is-production";

const STUDENT_CODE_PREFIX = "WARKA";
const REP_CODE_PREFIX = "REP";
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function normalizeAccessCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidStudentAccessCode(code: string): boolean {
  return /^WARKA-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{2}$/.test(
    normalizeAccessCode(code)
  );
}

export function isValidRepInviteCode(code: string): boolean {
  return /^REP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/.test(
    normalizeAccessCode(code)
  );
}

function randomSegment(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARSET[randomInt(0, CHARSET.length)];
  }
  return out;
}

export function generateStudentAccessCode(): string {
  return `${STUDENT_CODE_PREFIX}-${randomSegment(4)}-${randomSegment(2)}`;
}

export function generateRepInviteCode(): string {
  return `${REP_CODE_PREFIX}-${randomSegment(4)}-${randomSegment(4)}`;
}

function getAuthPepper(): string {
  const pepper = process.env.STUDENT_AUTH_PEPPER;
  if (pepper && pepper.length >= 16) return pepper;

  if (isProductionRuntime()) {
    throw new Error("STUDENT_AUTH_PEPPER must be set in production (min 16 chars)");
  }

  // Dev-only fallback — never use service role key as pepper (key rotation breaks passwords)
  return "warka-dev-pepper-change-in-production";
}

export function studentAuthEmail(accessCode: string): string {
  const normalized = normalizeAccessCode(accessCode).toLowerCase().replace(/-/g, "");
  return `access+${normalized}@students.warka.app`;
}

export function deriveStudentPassword(accessCode: string): string {
  const normalized = normalizeAccessCode(accessCode);
  return createHmac("sha256", getAuthPepper()).update(normalized).digest("base64url").slice(0, 32);
}

export function phoneLastFour(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

export function verifyPhoneLastFour(
  phone: string | null | undefined,
  lastFour: string | null | undefined
): boolean {
  if (!lastFour?.trim()) return true;
  const stored = phoneLastFour(phone);
  if (!stored) return false;
  return stored === lastFour.replace(/\D/g, "").slice(-4);
}
