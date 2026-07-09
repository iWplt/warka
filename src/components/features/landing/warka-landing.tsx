"use client";

import Image from "next/image";
import {
  Award,
  Palette,
  Truck,
  Headset,
  ArrowLeft,
  ChevronLeft,
  Users,
  GraduationCap,
  Building2,
  Eye,
  Layers,
  BadgeCheck,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { GRADUATION_PRODUCT_META } from "@/lib/constants/graduation-products";
import { DEFAULT_STOREFRONT_PRICES } from "@/lib/constants/storefront-prices";
import { LANDING_IMAGES } from "@/lib/constants/landing-images";
import { SITE_CONTACT } from "@/lib/constants/site-contact";
import { formatIqd } from "@/lib/format/currency";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollRevealStagger,
  SectionHeading,
} from "@/components/ui/scroll-reveal";
import { SeasonalBanner } from "@/components/features/landing/seasonal-banner";
import { LandingBundlesSection } from "@/components/features/landing/landing-bundles-section";
import { filterFeaturedProducts } from "@/lib/products/dedupe-catalog";
import type { PriceCatalogItem, Product, ProductBundle, Profile } from "@/types/database";

type WarkaLandingProps = {
  prices: PriceCatalogItem[];
  catalogProducts?: Product[];
  bundles?: ProductBundle[];
  profile: Profile | null;
  dashboardPath?: string;
  heroImageUrl?: string;
};

function buildPriceMap(prices: PriceCatalogItem[]): Map<string, PriceCatalogItem> {
  const map = new Map<string, PriceCatalogItem>();
  for (const item of prices) {
    if (item.active) map.set(item.product_type, item);
  }
  return map;
}

type LandingProduct = {
  key: string;
  name: string;
  price: string;
  image: string;
  isCustom: boolean;
};

export function WarkaLanding({ prices, catalogProducts = [], bundles = [], profile, dashboardPath, heroImageUrl }: WarkaLandingProps) {
  const t = useTranslations("landing");
  const tContact = useTranslations("landing.contact");
  const tProducts = useTranslations("landing.products");
  const tFeatures = useTranslations("landing.features");
  const tRoles = useTranslations("landing.roles");
  const locale = useLocale();
  const isAuthenticated = Boolean(profile);
  const orderHref = isAuthenticated ? "/checkout" : "/login";

  const features = [
    { icon: Award, title: tFeatures("items.quality.title"), desc: tFeatures("items.quality.description") },
    { icon: Palette, title: tFeatures("items.design.title"), desc: tFeatures("items.design.description") },
    { icon: Truck, title: tFeatures("items.delivery.title"), desc: tFeatures("items.delivery.description") },
    { icon: Headset, title: tFeatures("items.support.title"), desc: tFeatures("items.support.description") },
  ];

  const priceMap = buildPriceMap(prices);
  const products: LandingProduct[] = [];

  const catalogActive = catalogProducts.filter((p) => p.active);

  const toLandingProduct = (p: Product): LandingProduct => {
    const meta = GRADUATION_PRODUCT_META.find((m) => m.productType === p.product_type);
    const isCustom = p.product_type === "custom";
    return {
      key: p.id,
      name: locale === "ar" ? p.name_ar : p.name_en,
      price: isCustom
        ? tProducts("items.custom.description")
        : tProducts("priceFrom", { price: formatIqd(Number(p.price), locale) }),
      image: p.image || meta?.image || LANDING_IMAGES.products.custom,
      isCustom,
    };
  };

  if (catalogActive.length > 0) {
    for (const p of catalogActive) {
      products.push(toLandingProduct(p));
    }
  } else {
    for (const meta of GRADUATION_PRODUCT_META) {
      if (meta.productType === "custom") {
        products.push({
          key: meta.productType,
          name: tProducts("items.custom.title"),
          price: tProducts("items.custom.description"),
          image: meta.image,
          isCustom: true,
        });
        continue;
      }
      const catalog = priceMap.get(meta.productType);
      const basePrice = catalog
        ? Number(catalog.base_price)
        : DEFAULT_STOREFRONT_PRICES[meta.productType];
      products.push({
        key: meta.productType,
        name: catalog?.label || tProducts(`items.${meta.translationKey}.title`),
        price: tProducts("priceFrom", { price: formatIqd(basePrice, locale) }),
        image: meta.image,
        isCustom: false,
      });
    }
  }

  const featuredCatalog = filterFeaturedProducts(catalogActive, 8);
  const displayProducts =
    featuredCatalog.length > 0
      ? featuredCatalog.map(toLandingProduct)
      : products.slice(0, 8);

  const steps = [
    { num: 1, title: t("steps.items.order.title"), desc: t("steps.items.order.description") },
    { num: 2, title: t("steps.items.logo.title"), desc: t("steps.items.logo.description") },
    { num: 3, title: t("steps.items.print.title"), desc: t("steps.items.print.description") },
    { num: 4, title: t("steps.items.deliver.title"), desc: t("steps.items.deliver.description") },
  ];

  const values = [
    { icon: Eye, title: t("values.items.tracking.title"), desc: t("values.items.tracking.description") },
    { icon: BadgeCheck, title: t("values.items.quality.title"), desc: t("values.items.quality.description") },
    { icon: Users, title: t("values.items.network.title"), desc: t("values.items.network.description") },
    { icon: Layers, title: t("values.items.trust.title"), desc: t("values.items.trust.description") },
  ];

  const audiences = [
    {
      icon: GraduationCap,
      title: tRoles("student.title"),
      desc: tRoles("student.description"),
      cta: tRoles("student.cta"),
      href: "/login" as const,
    },
    {
      icon: Users,
      title: tRoles("representative.title"),
      desc: tRoles("representative.description"),
      cta: tRoles("representative.cta"),
      href: "/login" as const,
    },
    {
      icon: Building2,
      title: tRoles("coordinator.title"),
      desc: tRoles("coordinator.description"),
      cta: tRoles("coordinator.cta"),
      href: "#contact" as const,
    },
  ];

  const heroImage = heroImageUrl ?? LANDING_IMAGES.hero;

  return (
    <div className="min-h-screen bg-warka-surface font-arabic">
      <SeasonalBanner />

      {/* Atelier hero: brand + one headline + one sentence + CTAs + full-bleed image */}
      <section id="home" className="relative overflow-hidden bg-warka-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:min-h-[min(88vh,820px)] lg:grid-cols-2">
          <div className="relative order-1 min-h-[280px] sm:min-h-[360px] lg:order-2 lg:min-h-full">
            <Image
              src={heroImage}
              alt={t("hero.imageAlt")}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent lg:bg-gradient-to-s lg:from-black/10 lg:via-transparent" />
          </div>

          <div className="order-2 flex flex-col justify-center px-4 py-10 sm:px-8 sm:py-14 lg:order-1 lg:px-12 lg:py-20 xl:px-16">
            <p className="font-display mb-5 text-sm font-semibold tracking-[0.22em] text-warka-primary">
              WARKA
            </p>
            <h1 className="mb-5 max-w-xl text-3xl leading-[1.15] font-bold text-warka-text sm:text-4xl lg:text-[2.75rem] xl:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mb-8 max-w-md text-sm leading-relaxed text-warka-text-secondary sm:text-base">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={isAuthenticated && dashboardPath ? dashboardPath : orderHref}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-warka-primary px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark"
              >
                {t("hero.ctaPrimary")}
              </Link>
              <Link
                href="/products"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warka-primary px-7 py-3 text-sm font-semibold text-warka-primary transition-colors hover:bg-warka-primary hover:text-white"
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-warka-border/60 bg-warka-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ScrollRevealStagger className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
            {features.map((f) => (
              <ScrollRevealItem key={f.title} className="flex items-start gap-3">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-warka-primary" aria-hidden />
                <div>
                  <div className="text-sm font-semibold text-warka-text">{f.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-warka-text-secondary">{f.desc}</div>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealStagger>
        </div>
      </section>

      <section className="bg-warka-surface py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <ScrollReveal>
            <h2 className="mb-4 text-3xl font-bold text-warka-text lg:text-4xl">{t("philosophy.title")}</h2>
            <p className="mb-6 text-sm leading-relaxed text-warka-text-secondary sm:text-base">{t("philosophy.body")}</p>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 font-medium text-warka-primary hover:underline"
            >
              {t("philosophy.cta")}
              <ChevronLeft className="h-4 w-4" />
            </a>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-warka-bg/50 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {values.map((v) => (
              <ScrollReveal key={v.title}>
                <div className="flex flex-col">
                  <v.icon className="mb-4 h-6 w-6 text-warka-primary" aria-hidden />
                  <h3 className="mb-2 text-base font-bold text-warka-text">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-warka-text-secondary">{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="scroll-mt-16 bg-warka-surface py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col items-center gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading title={tProducts("title")} subtitle={tProducts("subtitle")} className="mb-0" />
            <Link
              href="/products"
              className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-warka-primary px-5 py-2.5 text-sm font-semibold text-warka-primary transition-colors hover:bg-warka-primary hover:text-white sm:w-auto"
            >
              {tProducts("viewAll")}
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>

          {displayProducts.length === 0 ? (
            <ScrollReveal>
              <div className="atelier-surface px-6 py-12 text-center">
                <p className="text-warka-text-secondary">{tProducts("empty")}</p>
              </div>
            </ScrollReveal>
          ) : (
            <ScrollRevealStagger className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {displayProducts.map((p) => (
                  <ScrollRevealItem
                    key={p.key}
                    className="group flex h-full flex-col overflow-hidden border-b border-warka-border/70 bg-transparent"
                  >
                    {p.isCustom ? (
                      <div className="flex aspect-[4/5] items-center justify-center bg-warka-bg sm:aspect-square">
                        <div className="text-center px-2">
                          <Palette className="mx-auto mb-1.5 h-7 w-7 text-warka-primary sm:mb-2 sm:h-10 sm:w-10" />
                          <span className="text-[11px] text-warka-text-secondary sm:text-sm">
                            {tProducts("items.custom.title")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[4/5] overflow-hidden bg-warka-bg sm:aspect-square">
                        <Image
                          src={p.image}
                          alt={p.name}
                          width={400}
                          height={400}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col py-4">
                      <h3 className="mb-1 line-clamp-2 text-xs font-semibold leading-snug text-warka-text sm:text-base">
                        {p.name}
                      </h3>
                      <p className="mb-3 line-clamp-2 text-[11px] text-warka-text-secondary sm:text-sm">{p.price}</p>
                      <Link
                        href={`/products/${p.key}`}
                        className="mt-auto text-sm font-semibold text-warka-primary underline-offset-4 hover:underline"
                      >
                        {tContact("cta")}
                      </Link>
                    </div>
                  </ScrollRevealItem>
              ))}
            </ScrollRevealStagger>
          )}
        </div>
      </section>

      <LandingBundlesSection catalogProducts={catalogActive} bundles={bundles} />

      <section id="how-it-works" className="scroll-mt-16 bg-warka-bg/50 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t("steps.title")} subtitle={t("steps.subtitle")} className="mb-12" />

          <div className="relative">
            <ScrollRevealStagger className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <ScrollRevealItem key={s.num} className="relative text-center lg:text-start">
                  <div className="mb-3 font-display text-3xl font-bold text-warka-primary/35">
                    {String(s.num).padStart(2, "0")}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-warka-text">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-warka-text-secondary">{s.desc}</p>
                </ScrollRevealItem>
              ))}
            </ScrollRevealStagger>
          </div>
        </div>
      </section>

      <section id="audience" className="scroll-mt-16 bg-warka-surface py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={tRoles("title")} subtitle={tRoles("subtitle")} />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {audiences.map((a) => (
              <ScrollReveal key={a.title}>
                <div className="flex h-full flex-col border-t border-warka-border pt-6">
                  <a.icon className="mb-4 h-6 w-6 text-warka-primary" aria-hidden />
                  <h3 className="mb-2 text-lg font-bold text-warka-text">{a.title}</h3>
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-warka-text-secondary">{a.desc}</p>
                  {a.href.startsWith("#") ? (
                    <a
                      href={a.href}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-warka-primary hover:underline"
                    >
                      {a.cta}
                      <ArrowLeft className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link
                      href={a.href}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-warka-primary hover:underline"
                    >
                      {a.cta}
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-warka-primary py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <ScrollReveal>
            <h2 className="mb-4 text-2xl font-bold text-white lg:text-3xl">{t("ctaStrip.title")}</h2>
            <p className="mb-8 text-sm text-white/80">
              {t("ctaStrip.bullets.1")} · {t("ctaStrip.bullets.2")} · {t("ctaStrip.bullets.3")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="rounded-lg bg-card px-6 py-3 text-sm font-semibold text-warka-primary transition-colors hover:bg-warka-bg"
              >
                {t("ctaStrip.ctaPrimary")}
              </Link>
              <a
                href="#contact"
                className="rounded-lg border border-card/70 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-card/10"
              >
                {t("ctaStrip.ctaSecondary")}
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section id="contact" className="scroll-mt-16 bg-warka-surface py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={tContact("title")} subtitle={tContact("subtitle")} />

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
            <ScrollReveal className="text-center sm:text-start">
              <Phone className="mx-auto mb-3 h-5 w-5 text-warka-primary sm:mx-0" aria-hidden />
              <h3 className="mb-1 text-sm font-semibold">{tContact("phone")}</h3>
              <a href={`tel:${SITE_CONTACT.phoneE164}`} className="text-sm text-warka-text-secondary" dir="ltr">
                {SITE_CONTACT.phoneDisplay}
              </a>
            </ScrollReveal>

            <ScrollReveal delay={0.09} className="text-center sm:text-start">
              <Mail className="mx-auto mb-3 h-5 w-5 text-warka-primary sm:mx-0" aria-hidden />
              <h3 className="mb-1 text-sm font-semibold">{tContact("email")}</h3>
              <a href={`mailto:${SITE_CONTACT.email}`} className="text-sm text-warka-text-secondary">
                {SITE_CONTACT.email}
              </a>
            </ScrollReveal>

            <ScrollReveal delay={0.18} className="text-center sm:text-start">
              <MapPin className="mx-auto mb-3 h-5 w-5 text-warka-primary sm:mx-0" aria-hidden />
              <h3 className="mb-1 text-sm font-semibold">{tContact("address")}</h3>
              <p className="text-sm text-warka-text-secondary">{tContact("addressValue")}</p>
            </ScrollReveal>
          </div>

          <div className="mt-10 text-center">
            <Link
              href={orderHref}
              className="inline-flex items-center gap-2 rounded-lg bg-warka-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark"
            >
              {tContact("cta")}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
