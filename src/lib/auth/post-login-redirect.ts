import type { UserRole } from "@/types/database";
import { getRedirectForRole } from "@/lib/auth/guards";

const LOCALE_PATH = /^\/(ar|en)\/[a-zA-Z0-9/_?=&%.-]+$/;

export function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!LOCALE_PATH.test(path)) return false;
  if (path.includes("..")) return false;
  return true;
}

export function resolvePostLoginPath(
  locale: string,
  role: UserRole,
  redirectPath?: string | null
): string {
  if (isSafeRedirectPath(redirectPath)) {
    return redirectPath;
  }
  return `/${locale}${getRedirectForRole(role)}`;
}
