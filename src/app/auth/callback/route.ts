import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/env";
import type { UserRole } from "@/types/database";

const ROLE_PATHS: Record<UserRole, string> = {
  admin: "/admin",
  employee: "/employee",
  representative: "/representative",
  student: "/student",
  embroidery: "/embroidery",
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const locale = searchParams.get("locale") || "ar";

  if (!code) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=invalid`);
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=config`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=invalid`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=invalid`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/${locale}/login?error=disabled`);
  }

  const dest = ROLE_PATHS[profile.role as UserRole] ?? "/student";
  return NextResponse.redirect(`${origin}/${locale}${dest}`);
}
