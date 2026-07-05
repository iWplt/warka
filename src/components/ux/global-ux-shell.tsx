"use client";

import { type ReactNode } from "react";
import { NetworkStatus } from "@/components/ux/network-status";
import { RouteUxGuard } from "@/components/ux/route-ux-guard";
import { WhatsAppButton } from "@/components/ux/whatsapp-button";
import { PageTransition } from "@/components/ux/page-transition";

import { NavigationProgress } from "@/components/ux/navigation-progress";
import { PWARegister } from "@/components/ux/pwa-register";

type GlobalUxShellProps = {
  children: ReactNode;
  showWhatsApp?: boolean;
};

export function GlobalUxShell({
  children,
  showWhatsApp = true,
}: GlobalUxShellProps) {
  return (
    <>
      <NavigationProgress />
      <PWARegister />
      <NetworkStatus />
      <RouteUxGuard />
      {showWhatsApp ? <WhatsAppButton /> : null}
      <PageTransition>{children}</PageTransition>
    </>
  );
}
