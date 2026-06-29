import createIntlMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { getSupabaseConfig, isPrismaAuthEnabled } from "@/lib/env";
import { handlePrismaAuthMiddleware } from "@/lib/auth/prisma-middleware";
import {
  LOCAL_SESSION_COOKIE,
  parseLocalSessionToken,
} from "@/lib/auth/local-session";
import { adminExists } from "@/lib/setup/admin-exists";

const intlMiddleware = createIntlMiddleware(routing);

const AUTH_PATHS = ["/login", "/register"];
const ROLE_PATHS: Record<string, string> = {
  admin: "/admin",
  employee: "/employee",
  representative: "/representative",
  student: "/student",
};

function stripLocale(pathname: string): { locale: string; path: string } {
  const match = pathname.match(/^\/(ar|en)(\/|$)/);
  if (match) {
    return {
      locale: match[1],
      path: pathname.replace(/^\/(ar|en)/, "") || "/",
    };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

function isLocalAuthEnabled(): boolean {
  if (process.env.LOCAL_AUTH_ENABLED === "true") return true;
  if (process.env.LOCAL_AUTH_ENABLED === "false") return false;
  return !getSupabaseConfig();
}

async function getLocalSessionRole(
  request: NextRequest
): Promise<string | null> {
  const token = request.cookies.get(LOCAL_SESSION_COOKIE)?.value;
  const session = await parseLocalSessionToken(token);
  return session?.role ?? null;
}

function isRoleAllowedForPath(path: string, role: string): boolean {
  if (path.startsWith("/admin")) return role === "admin";
  if (path.startsWith("/employee")) return role === "employee";
  if (path.startsWith("/representative")) return role === "representative";
  if (path.startsWith("/student")) return role === "student";
  return true;
}

export async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const { pathname } = request.nextUrl;
  const { locale, path } = stripLocale(pathname);

  if (isPrismaAuthEnabled()) {
    return handlePrismaAuthMiddleware(request, intlResponse);
  }

  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));
  const isSetupPath = path.startsWith("/setup");

  if (isSetupPath && getSupabaseConfig()) {
    const hasAdmin = await adminExists();
    if (hasAdmin === true) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  const isProtected =
    path.startsWith("/admin") ||
    path.startsWith("/employee") ||
    path.startsWith("/representative") ||
    path.startsWith("/student") ||
    path.startsWith("/checkout") ||
    path.startsWith("/notifications");

  if (isLocalAuthEnabled()) {
    if (!isProtected && !isAuthPath && !isSetupPath) {
      return intlResponse;
    }

    const role = await getLocalSessionRole(request);

    if (!role && isProtected) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role && isAuthPath) {
      const dest = ROLE_PATHS[role] ?? "/admin";
      return NextResponse.redirect(new URL(`/${locale}${dest}`, request.url));
    }

    if (role && isProtected && !isRoleAllowedForPath(path, role)) {
      return NextResponse.redirect(
        new URL(`/${locale}/unauthorized`, request.url)
      );
    }

    return intlResponse;
  }

  const config = getSupabaseConfig();
  if (!config) {
    if (isProtected) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    return intlResponse;
  }

  if (!isProtected && !isAuthPath && !isSetupPath) {
    return intlResponse;
  }

  let response = intlResponse;
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user) {
    return response;
  }

  if (isAuthPath || isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile?.is_active) {
      if (isProtected) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL(`/${locale}/login?error=disabled`, request.url)
        );
      }
      return response;
    }

    if (isAuthPath) {
      const dest = ROLE_PATHS[profile.role] ?? "/student";
      return NextResponse.redirect(new URL(`/${locale}${dest}`, request.url));
    }

    if (!isRoleAllowedForPath(path, profile.role)) {
      return NextResponse.redirect(
        new URL(`/${locale}/unauthorized`, request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
