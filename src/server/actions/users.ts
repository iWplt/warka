"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, requireRole } from "@/lib/auth/guards";
import { logActivityInternal as logActivity } from "@/lib/notifications/internal";
import type { PermissionKey, Profile, UserRole } from "@/types/database";
import { ALL_PERMISSIONS } from "@/types/database";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  role: z.enum(["representative", "student", "embroidery"]),
  college: z.preprocess(emptyToUndefined, z.string().optional()),
  department: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function createUser(input: z.infer<typeof createUserSchema>) {
  const adminProfile = await requireRole(["admin"]);
  const parsed = createUserSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid user data");
  }

  const data = parsed.data;

  const admin = createAdminClient();
  if (!admin) {
    throw new Error(
      "User creation requires Supabase admin credentials. Configure Supabase to add users."
    );
  }

  const { data: authData, error } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  });

  if (error) {
    if (error.message.includes("already been registered") || error.message.includes("already exists")) {
      throw new Error("This email is already registered.");
    }
    throw new Error(error.message || "Failed to create user");
  }

  if (!authData.user?.id) {
    throw new Error("User was not created");
  }

  const userId = authData.user.id;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: data.full_name,
      phone: data.phone ?? null,
      role: data.role,
      college: data.college ?? null,
      department: data.department ?? null,
      is_active: true,
      locale: "ar",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(profileError.message || "Failed to save user profile");
  }

  try {
    await logActivity(adminProfile.id, "create_user", "profile", userId, {
      role: data.role,
    });
  } catch {
    // User creation should succeed even if activity logging fails
  }

  revalidatePath("/admin/users");
  return { id: userId };
}

export async function updateUser(
  userId: string,
  updates: {
    full_name?: string;
    phone?: string;
    college?: string;
    department?: string;
    stage?: string;
    class_name?: string;
    graduation_year?: number;
    is_active?: boolean;
  }
) {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  await requireRole(["admin"]);

  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client not configured");

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
  return { success: true };
}

export async function getUsersByRole(role: UserRole) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "admin") return [];

    const supabase = await createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", role)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`getUsersByRole(${role}) failed:`, error.message);
      return [];
    }

    return (data ?? []) as Profile[];
  } catch {
    return [];
  }
}

export async function getEmployees() {
  return getUsersByRole("employee");
}

export async function updateEmployeePermissions(
  employeeId: string,
  permissions: PermissionKey[]
) {
  const admin = await requireRole(["admin"]);
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  await supabase
    .from("employee_permissions")
    .delete()
    .eq("employee_id", employeeId);

  const rows = ALL_PERMISSIONS.map((key) => ({
    employee_id: employeeId,
    permission_key: key,
    granted: permissions.includes(key),
  }));

  const { error } = await supabase.from("employee_permissions").insert(rows);
  if (error) throw new Error(error.message);

  await logActivity(
    admin.id,
    "update_permissions",
    "profile",
    employeeId,
    { permissions }
  );

  revalidatePath(`/admin/employees/${employeeId}/permissions`);
  return { success: true };
}

export async function getEmployeePermissions(employeeId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("employee_permissions")
    .select("permission_key, granted")
    .eq("employee_id", employeeId)
    .eq("granted", true);

  return (data ?? []).map((r) => r.permission_key as PermissionKey);
}

export async function saveCustomRole(name: string, permissions: PermissionKey[]) {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("custom_roles")
    .insert({ name, permissions })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/employees");
  return data;
}

export async function getCustomRoles() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase.from("custom_roles").select("*");
  return data ?? [];
}

export async function applyCustomRole(employeeId: string, roleId: string) {
  await requireRole(["admin"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: role } = await supabase
    .from("custom_roles")
    .select("permissions")
    .eq("id", roleId)
    .single();

  if (!role) throw new Error("Role not found");

  const permissions = role.permissions as PermissionKey[];
  return updateEmployeePermissions(employeeId, permissions);
}
