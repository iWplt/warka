/** Local landing imagery — change paths here or set NEXT_PUBLIC_LANDING_HERO_IMAGE in env. */
export const LANDING_IMAGES = {
  hero: "/assets/landing/hero-image.jpg",
  products: {
    sash: "/assets/landing/product-sash.jpg",
    cap: "/assets/landing/product-cap.jpg",
    gown: "/assets/landing/product-gown.jpg",
    custom: "/assets/products/custom/thumbnail.png",
  },
} as const;

/** Hero image for homepage — env overrides the default asset path. */
export function getLandingHeroImage(): string {
  const fromEnv = process.env.NEXT_PUBLIC_LANDING_HERO_IMAGE?.trim();
  return fromEnv || LANDING_IMAGES.hero;
}
