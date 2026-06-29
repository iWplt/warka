import { getCurrentProfile } from "@/lib/auth/guards";
import { SiteHeader } from "@/components/layouts/site-header";
import { SiteFooter } from "@/components/layouts/site-footer";
import { MobileBottomNav } from "@/components/layouts/mobile-bottom-nav";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen bg-warka-bg font-arabic">
      <SiteHeader profile={profile} />
      <main className="pb-16 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileBottomNav profile={profile} />
    </div>
  );
}
