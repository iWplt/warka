"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig, isBootstrapAllowed } from "@/lib/env";
import { logSecurityEvent } from "@/lib/security/audit-log";

const bootstrapSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  locale: z.string().default("ar"),
});

export type SetupStatus = {
  ready: boolean;
  needsBootstrap: boolean;
  reason?: "no-config" | "admin-exists" | "bootstrap-disabled";
};

export async function getSetupStatus(): Promise<SetupStatus> {
  if (!isBootstrapAllowed()) {
    return { ready: true, needsBootstrap: false, reason: "bootstrap-disabled" };
  }

  if (!getSupabaseConfig()) {
    return { ready: false, needsBootstrap: false, reason: "no-config" };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ready: false, needsBootstrap: false, reason: "no-config" };
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1);

  if (error) {
    return { ready: false, needsBootstrap: false, reason: "no-config" };
  }

  if (data?.length) {
    return { ready: true, needsBootstrap: false, reason: "admin-exists" };
  }

  return { ready: true, needsBootstrap: true };
}

export async function bootstrapFirstAdmin(formData: FormData) {
  const locale = (formData.get("locale") as string) || "ar";

  if (!isBootstrapAllowed()) {
    logSecurityEvent("permission.denied", { scope: "bootstrap", reason: "disabled" });
    redirect(`/${locale}/login`);
  }

  const parsed = bootstrapSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    locale: formData.get("locale") ?? "ar",
  });

  if (!parsed.success) {
    redirect(`/${locale}/setup?error=invalid`);
  }

  const status = await getSetupStatus();
  if (!status.needsBootstrap) {
    redirect(`/${locale}/login`);
  }

  const admin = createAdminClient();
  if (!admin) {
    redirect(`/${locale}/setup?error=config`);
  }

  const { email, password, fullName } = parsed.data;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "admin" },
  });

  if (authError) {
    const message = authError.message.toLowerCase();
    if (message.includes("already") && message.includes("registered")) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users?.find(
        (user) => user.email?.toLowerCase() === email.toLowerCase()
      );
      if (!existing) {
        redirect(`/${locale}/setup?error=invalid`);
      }

      const { error: promoteError } = await admin
        .from("profiles")
        .upsert(
          {
            id: existing.id,
            role: "admin",
            full_name: fullName,
            is_active: true,
            email,
          },
          { onConflict: "id" }
        );

      if (promoteError) {
        redirect(`/${locale}/setup?error=profile`);
      }

      redirect(`/${locale}/login?message=admin-ready`);
    }

    redirect(`/${locale}/setup?error=invalid`);
  }

  if (!authData.user?.id) {
    redirect(`/${locale}/setup?error=invalid`);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: authData.user.id,
      role: "admin",
      full_name: fullName,
      email,
      is_active: true,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    redirect(`/${locale}/setup?error=profile`);
  }

  redirect(`/${locale}/login?message=admin-ready`);
}
