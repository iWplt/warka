"use client";

import { type ReactNode } from "react";
import { NetworkStatus } from "@/components/ux/network-status";
import { PWAInstallPrompt } from "@/components/ux/pwa-install-prompt";
import { WhatsAppButton } from "@/components/ux/whatsapp-button";
import { PageTransition } from "@/components/ux/page-transition";
import { SocialProofToast } from "@/components/ux/social-proof-toast";

import { NavigationProgress } from "@/components/ux/navigation-progress";
import { PWARegister } from "@/components/ux/pwa-register";

type GlobalUxShellProps = {
  children: ReactNode;
  showWhatsApp?: boolean;
  showSocialProof?: boolean;
};

export function GlobalUxShell({
  children,
  showWhatsApp = true,
  showSocialProof = true,
}: GlobalUxShellProps) {
  return (
    <>
      <NavigationProgress />
      <PWARegister />
      <NetworkStatus />
      <PWAInstallPrompt />
      {showWhatsApp ? <WhatsAppButton /> : null}
      {showSocialProof ? <SocialProofToast /> : null}
      <PageTransition>{children}</PageTransition>
    </>
  );
}
