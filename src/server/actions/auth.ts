"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRedirectForRole } from "@/lib/auth/guards";
import { env } from "@/lib/env";
import {
  buildAuthRateLimitKey,
  clearAuthAttempts,
  isAuthRateLimited,
  recordAuthFailure,
} from "@/lib/auth/rate-limit";
import {
  createLocalSessionToken,
  isLocalAuthEnabled,
  LOCAL_SESSION_COOKIE,
  LOCAL_SESSION_MAX_AGE_SEC,
  validateLocalCredentials,
} from "@/lib/auth/local-session";
import {
  deriveStudentPassword,
  generateStudentAccessCode,
  isValidStudentAccessCode,
  normalizeAccessCode,
  studentAuthEmail,
  verifyPhoneLastFour,
} from "@/lib/auth/access-code";
import {
  reserveRepInviteCode,
  validateRepInviteCode,
} from "@/server/actions/invites";
import {
  finalizeRepInviteCodeInternal as finalizeRepInviteCode,
  releaseRepInviteCodeInternal as releaseRepInviteCode,
} from "@/lib/invites/lifecycle";
import { logSecurityEvent } from "@/lib/security/audit-log";
import { isProductionRuntime } from "@/lib/security/is-production";
import type { UserRole } from "@/types/database";
import { resolvePostLoginPath } from "@/lib/auth/post-login-redirect";

async function upsertProfileFromServer(
  userId: string,
  fields: {
    full_name: string;
    email?: string | null;
    phone?: string | null;
    role?: UserRole;
    college?: string | null;
    department?: string | null;
    graduation_year?: number | null;
    access_code?: string | null;
    student_id_number?: string | null;
  }
) {
  const admin = createAdminClient();
  if (!admin) return { error: "Admin client unavailable" as const };

  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: fields.full_name,
      email: fields.email ?? null,
      phone: fields.phone ?? null,
      role: fields.role ?? "student",
      college: fields.college ?? null,
      department: fields.department ?? null,
      graduation_year: fields.graduation_year ?? null,
      access_code: fields.access_code ?? null,
      student_id_number: fields.student_id_number ?? null,
      is_active: true,
    },
    { onConflict: "id" }
  );

  return error ? { error: error.message } : { error: null };
}

async function deleteAuthUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.auth.admin.deleteUser(userId);
}

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

async function guardAuthRateLimit(identifier: string, locale: string): Promise<void> {
  const ip = await getClientIp();
  const key = buildAuthRateLimitKey(identifier, ip);
  if (isAuthRateLimited(key)) {
    logSecurityEvent("auth.rate_limited", { ip });
    redirect(`/${locale}/login?error=rate-limit`);
  }
}

async function finishAuthSession(
  userId: string,
  locale: string,
  identifier: string,
  redirectPath?: string | null
): Promise<never> {
  const supabase = await createClient();
  if (!supabase) redirect(`/${locale}/login?error=config`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    redirect(`/${locale}/login?error=disabled`);
  }

  const ip = await getClientIp();
  clearAuthAttempts(buildAuthRateLimitKey(identifier, ip));

  redirect(
    resolvePostLoginPath(locale, profile.role as UserRole, redirectPath)
  );
}

async function generateUniqueStudentCode(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
  for (let i = 0; i < 12; i++) {
    const code = generateStudentAccessCode();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("access_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate unique access code");
}

export async function signIn(formData: FormData) {
  const loginMode = (formData.get("loginMode") as string) || "email";
  const locale = (formData.get("locale") as string) || "ar";

  if (loginMode === "student-code") {
    return signInWithAccessCode(formData);
  }

  const login =
    (formData.get("username") as string) ||
    (formData.get("email") as string) ||
    "";
  const password = formData.get("password") as string;

  if (isLocalAuthEnabled()) {
    await guardAuthRateLimit(login.trim(), locale);
    if (!validateLocalCredentials(login.trim(), password)) {
      const ip = await getClientIp();
      recordAuthFailure(buildAuthRateLimitKey(login.trim(), ip));
      logSecurityEvent("auth.login_failed", { method: "local", ip });
      redirect(`/${locale}/login?error=invalid`);
    }

    const token = await createLocalSessionToken({
      sub: "local-admin",
      role: "admin",
      full_name: login.trim(),
    });

    const cookieStore = await cookies();
    cookieStore.set(LOCAL_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProductionRuntime(),
      path: "/",
      maxAge: LOCAL_SESSION_MAX_AGE_SEC,
    });

    redirect(`/${locale}/admin`);
  }

  await guardAuthRateLimit(login.trim(), locale);

  const supabase = await createClient();
  if (!supabase) {
    redirect(`/${locale}/login?error=config`);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: login.trim(),
    password,
  });

  if (error) {
    const ip = await getClientIp();
    recordAuthFailure(buildAuthRateLimitKey(login.trim(), ip));
    logSecurityEvent("auth.login_failed", { method: "password", ip });
    redirect(`/${locale}/login?error=invalid`);
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    const result = await upsertProfileFromServer(data.user.id, {
      full_name:
        (data.user.user_metadata?.full_name as string) ||
        data.user.email ||
        "User",
      email: data.user.email ?? undefined,
      role: "student",
    });
    if (result.error) {
      redirect(`/${locale}/login?error=profile`);
    }

    const refetch = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", data.user.id)
      .single();
    profile = refetch.data;
  }

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    redirect(`/${locale}/login?error=disabled`);
  }

  const redirectPath = (formData.get("redirect") as string)?.trim() || null;
  redirect(
    resolvePostLoginPath(locale, profile.role as UserRole, redirectPath)
  );
}

export async function signInWithAccessCode(formData: FormData) {
  const locale = (formData.get("locale") as string) || "ar";
  const rawCode = (formData.get("accessCode") as string) || "";
  const phoneLast4 = (formData.get("phoneLast4") as string) || "";
  const code = normalizeAccessCode(rawCode);

  await guardAuthRateLimit(code || "student-code", locale);

  if (!isValidStudentAccessCode(code)) {
    redirect(`/${locale}/login?error=invalid-code`);
  }

  const admin = createAdminClient();
  if (!admin) redirect(`/${locale}/login?error=config`);

  const { data: profile } = await admin
    .from("profiles")
    .select("id, phone, role, is_active")
    .eq("access_code", code)
    .eq("role", "student")
    .maybeSingle();

  if (!profile?.is_active) {
    const ip = await getClientIp();
    recordAuthFailure(buildAuthRateLimitKey(code, ip));
    redirect(`/${locale}/login?error=invalid-code`);
  }

  if (phoneLast4.trim() && !verifyPhoneLastFour(profile.phone, phoneLast4)) {
    const ip = await getClientIp();
    recordAuthFailure(buildAuthRateLimitKey(code, ip));
    redirect(`/${locale}/login?error=phone-mismatch`);
  }

  const supabase = await createClient();
  if (!supabase) redirect(`/${locale}/login?error=config`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: studentAuthEmail(code),
    password: deriveStudentPassword(code),
  });

  if (error || !data.user) {
    const ip = await getClientIp();
    recordAuthFailure(buildAuthRateLimitKey(code, ip));
    redirect(`/${locale}/login?error=invalid-code`);
  }

  await finishAuthSession(
    data.user.id,
    locale,
    code,
    (formData.get("redirect") as string)?.trim() || null
  );
}

export async function signUpStudent(formData: FormData) {
  const locale = (formData.get("locale") as string) || "ar";

  if (isLocalAuthEnabled()) {
    redirect(`/${locale}/login?error=local-only`);
  }

  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const college = (formData.get("college") as string)?.trim();
  const studentIdNumber = (formData.get("studentIdNumber") as string)?.trim() || null;
  const department = (formData.get("department") as string)?.trim() || null;

  if (!fullName || !phone || !college) {
    redirect(`/${locale}/register?error=invalid`);
  }

  await guardAuthRateLimit(phone, locale);

  const admin = createAdminClient();
  if (!admin) redirect(`/${locale}/register?error=config`);

  const accessCode = await generateUniqueStudentCode(admin);
  const authEmail = studentAuthEmail(accessCode);
  const authPassword = deriveStudentPassword(accessCode);

  const { data, error } = await admin.auth.admin.createUser({
    email: authEmail,
    password: authPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "student",
      phone,
      college,
      department,
      student_id_number: studentIdNumber,
      access_code: accessCode,
    },
  });

  if (error || !data.user?.id) {
    const ip = await getClientIp();
    recordAuthFailure(buildAuthRateLimitKey(phone, ip));
    redirect(`/${locale}/register?error=invalid`);
  }

  const result = await upsertProfileFromServer(data.user.id, {
    full_name: fullName,
    email: null,
    phone,
    role: "student",
    college,
    department,
    access_code: accessCode,
    student_id_number: studentIdNumber,
  });

  if (result.error) {
    redirect(`/${locale}/register?error=profile`);
  }

  redirect(`/${locale}/register/success?code=${encodeURIComponent(accessCode)}`);
}

export async function signUp(formData: FormData) {
  const locale = (formData.get("locale") as string) || "ar";
  const accountType = (formData.get("accountType") as string) || "student";

  if (accountType === "student") {
    return signUpStudent(formData);
  }

  if (isLocalAuthEnabled()) {
    redirect(`/${locale}/login?error=local-only`);
  }

  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string).trim();
  const phone = (formData.get("phone") as string).trim();
  const college = (formData.get("college") as string) || null;
  const department = (formData.get("department") as string) || null;
  const graduationYearRaw = formData.get("graduationYear") as string;
  const graduationYear = graduationYearRaw
    ? Number.parseInt(graduationYearRaw, 10)
    : null;
  const inviteCode = (formData.get("inviteCode") as string)?.trim() ?? "";

  const inviteCheck = await validateRepInviteCode(inviteCode, email);
  if (!inviteCheck.valid) {
    redirect(`/${locale}/register?error=invalid-invite`);
  }

  const reserved = await reserveRepInviteCode(inviteCode, email);
  if (!reserved.success || !reserved.inviteId) {
    redirect(`/${locale}/register?error=invalid-invite`);
  }
  const inviteId = reserved.inviteId;

  await guardAuthRateLimit(email, locale);

  const supabase = await createClient();
  if (!supabase) {
    redirect(`/${locale}/register?error=config`);
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "representative",
        phone,
        college,
        department,
        graduation_year: graduationYear,
      },
      emailRedirectTo: `${appUrl}/auth/callback?locale=${locale}`,
    },
  });

  if (error) {
    await releaseRepInviteCode(inviteId);
    const ip = await getClientIp();
    recordAuthFailure(buildAuthRateLimitKey(email, ip));
    redirect(`/${locale}/register?error=invalid`);
  }

  if (data.user) {
    const result = await upsertProfileFromServer(data.user.id, {
      full_name: fullName,
      email,
      phone,
      role: "representative",
      college,
      department,
      graduation_year: graduationYear,
    });

    if (result.error) {
      await deleteAuthUser(data.user.id);
      await releaseRepInviteCode(inviteId);
      redirect(`/${locale}/register?error=profile`);
    }

    await finalizeRepInviteCode(inviteId, data.user.id);
  }

  if (!data.session) {
    redirect(`/${locale}/login?message=confirm-email`);
  }

  redirect(`/${locale}${getRedirectForRole("representative")}`);
}

export async function signOut(formData: FormData) {
  const locale = (formData.get("locale") as string) || "ar";

  if (isLocalAuthEnabled()) {
    const cookieStore = await cookies();
    cookieStore.delete(LOCAL_SESSION_COOKIE);
    redirect(`/${locale}/login`);
  }

  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect(`/${locale}/login`);
}
