"use client";

import { usePathname } from "next/navigation";
import { PWAInstallPrompt } from "@/components/ux/pwa-install-prompt";
import { SocialProofToast } from "@/components/ux/social-proof-toast";

const QUIET_ROUTE_PREFIXES = [
  "/products",
  "/checkout",
  "/cart",
  "/student/orders",
  "/compare",
];

function normalizePath(pathname: string) {
  return pathname.replace(/^\/(ar|en)/, "") || "/";
}

function isQuietRoute(pathname: string) {
  const normalized = normalizePath(pathname);
  return QUIET_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

function isHomepage(pathname: string) {
  return normalizePath(pathname) === "/";
}

export function RouteUxGuard() {
  const pathname = usePathname() ?? "/";
  const quiet = isQuietRoute(pathname);
  const homepage = isHomepage(pathname);

  return (
    <>
      {!quiet ? <PWAInstallPrompt delayOnHomepage={homepage} /> : null}
      {homepage ? <SocialProofToast /> : null}
    </>
  );
}
