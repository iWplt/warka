import { getCurrentProfile, getRedirectForRole } from "@/lib/auth/guards";
import { getLandingHeroImage } from "@/lib/constants/landing-images";
import type { PriceCatalogItem } from "@/types/database";
import { WarkaLanding } from "./warka-landing";

type GraduationLandingProps = {
  prices: PriceCatalogItem[];
  catalogProducts: Awaited<ReturnType<typeof import("@/server/actions/products").getProductsCatalog>>;
  bundles: Awaited<ReturnType<typeof import("@/server/actions/bundles").getActiveBundles>>;
};

export async function GraduationLanding({ prices, catalogProducts, bundles }: GraduationLandingProps) {
  const profile = await getCurrentProfile();

  return (
    <WarkaLanding
      prices={prices}
      catalogProducts={catalogProducts}
      bundles={bundles}
      profile={profile}
      dashboardPath={profile ? getRedirectForRole(profile.role) : undefined}
      heroImageUrl={getLandingHeroImage()}
    />
  );
}
