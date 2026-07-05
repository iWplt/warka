import { getCurrentProfile } from "@/lib/auth/guards";
import { SiteHeader } from "@/components/layouts/site-header";
import { MobileBottomNav } from "@/components/layouts/mobile-bottom-nav";

export async function PublicSiteHeader() {
  const profile = await getCurrentProfile();
  return <SiteHeader profile={profile} />;
}

export async function PublicMobileNav() {
  const profile = await getCurrentProfile();
  return <MobileBottomNav profile={profile} />;
}
