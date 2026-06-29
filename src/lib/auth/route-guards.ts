import type { Role } from "@prisma/client";

/** Dashboard path per role (without locale prefix). */
export const ROLE_DASHBOARD_PATHS: Record<Role, string> = {
  ADMIN: "/admin",
  REPRESENTATIVE: "/representative",
  STUDENT: "/student",
};

/** Maps NextAuth role enum to lowercase path segment. */
export const ROLE_PATH_SEGMENT: Record<Role, string> = {
  ADMIN: "admin",
  REPRESENTATIVE: "representative",
  STUDENT: "student",
};

/**
 * Returns whether a user role may access a given path (without locale).
 */
export function isRoleAllowedForPath(path: string, role: Role): boolean {
  if (path.startsWith("/admin")) {
    return role === "ADMIN";
  }
  if (path.startsWith("/representative")) {
    return role === "REPRESENTATIVE";
  }
  if (path.startsWith("/student")) {
    return role === "STUDENT";
  }
  return true;
}

/**
 * Strips `/ar` or `/en` locale prefix from a pathname.
 */
export function stripLocalePath(pathname: string): string {
  return pathname.replace(/^\/(ar|en)/, "") || "/";
}

/**
 * Extracts locale from pathname; defaults to `ar`.
 */
export function extractLocale(pathname: string): "ar" | "en" {
  const match = pathname.match(/^\/(ar|en)(\/|$)/);
  return match?.[1] === "en" ? "en" : "ar";
}
