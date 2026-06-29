import { cookies } from "next/headers";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  isLocalAuthEnabled,
  LOCAL_SESSION_COOKIE,
  localSessionToProfile,
  parseLocalSessionToken,
} from "@/lib/auth/local-session";
import type { PermissionKey, Profile, UserRole } from "@/types/database";
import { ALL_PERMISSIONS } from "@/types/database";
import { getDashboardPath } from "./permissions";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

export const getLocalProfileFromCookies = cache(async (): Promise<Profile | null> => {
  if (!isLocalAuthEnabled()) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(LOCAL_SESSION_COOKIE)?.value;
  const session = await parseLocalSessionToken(token);
  if (!session) return null;

  return localSessionToProfile(session);
});

export const getSessionUser = cache(async () => {
  const localProfile = await getLocalProfileFromCookies();
  if (localProfile) {
    return { id: localProfile.id };
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  if (userId === "local-admin") {
    return getLocalProfileFromCookies();
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const localProfile = await getLocalProfileFromCookies();
  if (localProfile) return localProfile;

  const user = await getSessionUser();
  if (!user) return null;
  return getProfile(user.id);
});

export const getEmployeePermissions = cache(async (
  employeeId: string
): Promise<PermissionKey[]> => {
  if (employeeId === "local-admin") {
    return [...ALL_PERMISSIONS];
  }

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("employee_permissions")
    .select("permission_key")
    .eq("employee_id", employeeId)
    .eq("granted", true);

  return (data ?? []).map((row) => row.permission_key as PermissionKey);
});

export async function hasPermission(
  userId: string,
  permission: PermissionKey
): Promise<boolean> {
  const profile = await getProfile(userId);
  if (!profile || !profile.is_active) return false;
  if (profile.role === "admin") return true;
  if (profile.role !== "employee") return false;

  const permissions = await getEmployeePermissions(userId);
  return permissions.includes(permission);
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AuthError("Not authenticated");
  if (!profile.is_active) throw new AuthError("Account is disabled");
  return profile;
}

export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await requireAuth();
  if (!roles.includes(profile.role)) {
    throw new PermissionError("Insufficient role");
  }
  return profile;
}

export async function requirePermission(
  permission: PermissionKey
): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.role === "admin") return profile;

  const allowed = await hasPermission(profile.id, permission);
  if (!allowed) throw new PermissionError(`Missing permission: ${permission}`);
  return profile;
}

export function getRedirectForRole(role: UserRole): string {
  return getDashboardPath(role);
}
