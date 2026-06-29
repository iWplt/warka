import { getCurrentProfile, getRedirectForRole } from "@/lib/auth/guards";
import type { PriceCatalogItem } from "@/types/database";
import { WarkaLanding } from "./warka-landing";

type GraduationLandingProps = {
  prices: PriceCatalogItem[];
  catalogProducts: Awaited<ReturnType<typeof import("@/server/actions/products").getProductsCatalog>>;
};

export async function GraduationLanding({ prices, catalogProducts }: GraduationLandingProps) {
  const profile = await getCurrentProfile();

  return (
    <WarkaLanding
      prices={prices}
      catalogProducts={catalogProducts}
      profile={profile}
      dashboardPath={profile ? getRedirectForRole(profile.role) : undefined}
    />
  );
}
