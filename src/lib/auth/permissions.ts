import type { UserRole } from "@/types/database";

export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  admin: "/admin",
  employee: "/employee",
  representative: "/representative",
  student: "/student",
};

export function getDashboardPath(role: UserRole): string {
  return ROLE_DASHBOARD_PATHS[role];
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === "admin" && pathname.startsWith("/admin")) return true;
  if (role === "employee" && pathname.startsWith("/employee")) return true;
  if (role === "representative" && pathname.startsWith("/representative")) {
    return true;
  }
  if (role === "student" && pathname.startsWith("/student")) return true;
  return false;
}
