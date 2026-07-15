import { Suspense } from "react";
import { SiteHeader } from "@/components/layouts/site-header";
import { SiteFooter } from "@/components/layouts/site-footer";
import { MobileBottomNav } from "@/components/layouts/mobile-bottom-nav";
import { PublicMobileNav, PublicSiteHeader } from "@/components/layouts/public-chrome";
import { GlobalUxShell } from "@/components/ux/global-ux-shell";
import { CompareBarContainer } from "@/components/ux/compare-bar-container";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalUxShell>
      <div className="min-h-dvh-safe bg-warka-bg font-arabic">
        <Suspense fallback={<SiteHeader profile={null} />}>
          <PublicSiteHeader />
        </Suspense>
        <main className="pb-16 md:pb-0">{children}</main>
        <SiteFooter />
        <Suspense fallback={<MobileBottomNav profile={null} />}>
          <PublicMobileNav />
        </Suspense>
        <CompareBarContainer />
      </div>
    </GlobalUxShell>
  );
}
