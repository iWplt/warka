import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { Role } from "@prisma/client";
import {
  extractLocale,
  isRoleAllowedForPath,
  ROLE_DASHBOARD_PATHS,
  stripLocalePath,
} from "@/lib/auth/route-guards";

const AUTH_PATHS = ["/login", "/register"];

/**
 * Edge-safe route protection using JWT session (no Prisma/bcrypt in middleware).
 */
export async function handlePrismaAuthMiddleware(
  request: NextRequest,
  intlResponse: NextResponse
): Promise<NextResponse> {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = request.nextUrl;
  const locale = extractLocale(pathname);
  const path = stripLocalePath(pathname);

  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));
  const isProtected =
    path.startsWith("/admin") ||
    path.startsWith("/representative") ||
    path.startsWith("/student");

  if (!isProtected && !isAuthPath) {
    return intlResponse;
  }

  if (!token && isProtected) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthPath) {
    const role = token.role as Role;
    const dest = ROLE_DASHBOARD_PATHS[role] ?? "/student";
    return NextResponse.redirect(new URL(`/${locale}${dest}`, request.url));
  }

  if (token && isProtected) {
    const role = token.role as Role;
    if (!isRoleAllowedForPath(path, role)) {
      return NextResponse.redirect(
        new URL(`/${locale}/unauthorized`, request.url)
      );
    }
  }

  return intlResponse;
}
