"use client";

import dynamic from "next/dynamic";
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
  Sparkles,
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
import { LANDING_IMAGES, getLandingHeroImage } from "@/lib/constants/landing-images";
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

const CountdownTimer = dynamic(
  () => import("@/components/ux/countdown-timer").then((m) => m.CountdownTimer),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="flex aspect-square h-14 w-14 items-center justify-center rounded-xl bg-warka-primary/20 sm:h-16 sm:w-16" />
            <div className="h-3 w-8 rounded bg-warka-border/40" />
          </div>
        ))}
      </div>
    ),
  }
);

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

  const marqueeItems = [
    t("marquee.items.track"),
    t("marquee.items.preview"),
    t("marquee.items.quality"),
    t("marquee.items.deliver"),
    t("marquee.items.transparent"),
    t("marquee.items.support"),
  ];

  const heroImage = heroImageUrl ?? LANDING_IMAGES.hero;

  return (
    <div className="min-h-screen bg-warka-bg font-arabic">
      <SeasonalBanner />

      <section id="home" className="relative overflow-hidden bg-warka-bg">
        <div className="pointer-events-none absolute top-0 start-0 hidden h-64 w-64 opacity-10 sm:block">
          <svg viewBox="0 0 200 200" fill="none" className="h-full w-full" aria-hidden>
            <path d="M20 180 Q 10 100, 80 50 Q 50 80, 20 180" fill="#5C5C47" />
            <path d="M20 180 Q 30 90, 100 30 Q 60 70, 20 180" fill="#4A4A38" opacity="0.7" />
            <path d="M20 180 Q 50 100, 120 60 Q 80 90, 20 180" fill="#5C5C47" opacity="0.5" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-2.5 py-3 sm:px-6 sm:py-10 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 items-center gap-3 sm:gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="relative order-1 lg:order-2 lg:col-start-2 lg:row-start-1 lg:ps-4">
              <div className="relative overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
                <Image
                  src={heroImage}
                  alt={t("hero.imageAlt")}
                  width={800}
                  height={600}
                  className="aspect-[16/10] h-auto w-full object-cover sm:aspect-[4/3] lg:aspect-auto"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 hidden rounded-xl bg-card/90 p-3 text-center backdrop-blur-sm sm:block">
                  <p className="text-xs text-warka-text-secondary">{t("hero.floatingCaption")}</p>
                </div>
              </div>
            </div>

            <div className="order-2 text-start lg:order-1 lg:col-start-1 lg:row-start-1 lg:pe-4">
              <span className="mb-3 inline-flex rounded-full bg-warka-primary/10 px-3 py-1 text-xs font-semibold text-warka-primary">
                {t("hero.kicker")}
              </span>
              <div className="mb-3">
                <CountdownTimer targetDate={new Date("2026-07-15T23:59:59")} />
              </div>
              <h1 className="mb-4 text-3xl leading-[1.12] font-bold text-warka-text sm:text-4xl lg:text-5xl xl:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="mb-5 max-w-lg text-sm leading-relaxed text-warka-text-secondary sm:mb-8 sm:text-base">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={isAuthenticated && dashboardPath ? dashboardPath : orderHref}
                  className="rounded-[10px] bg-warka-primary px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:bg-warka-primary-dark hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] sm:w-auto"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href="/products"
                  className="rounded-[10px] border-2 border-warka-primary px-6 py-3 text-center text-sm font-semibold text-warka-primary transition-all duration-200 hover:bg-warka-primary hover:text-white sm:w-auto"
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>
              <Link
                href="/products"
                className="mt-3 hidden min-h-11 items-center justify-between gap-3 rounded-xl border border-warka-primary/25 bg-warka-primary/8 px-4 py-3 text-start transition-colors hover:border-warka-primary/45 hover:bg-warka-primary/12 sm:mt-4 sm:flex sm:max-w-md"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-warka-text">{t("hero.ctaSecondary")}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-warka-text-secondary">
                    {t("hero.ctaProductsHint")}
                  </span>
                </span>
                <ArrowLeft className="size-4 shrink-0 text-warka-primary" aria-hidden />
              </Link>

              <div className="mt-4 flex items-center justify-center gap-3 border-t border-warka-border pt-3 sm:mt-8 sm:justify-start sm:gap-8 sm:border-0 sm:pt-0">
                <div className="text-center sm:text-start">
                  <div className="text-2xl font-bold text-warka-text">2.4k+</div>
                  <div className="mt-1 text-xs text-warka-text-secondary">{t("hero.statOrders")}</div>
                </div>
                <div className="h-8 w-px bg-warka-border" />
                <div className="text-center sm:text-start">
                  <div className="text-2xl font-bold text-warka-text">98%</div>
                  <div className="mt-1 text-xs text-warka-text-secondary">{t("hero.statSatisfaction")}</div>
                </div>
                <div className="h-8 w-px bg-warka-border" />
                <div className="text-center sm:text-start">
                  <div className="text-2xl font-bold text-warka-text">48h</div>
                  <div className="mt-1 text-xs text-warka-text-secondary">{t("hero.statDelivery")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden bg-warka-primary py-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="mx-8 flex items-center gap-2 text-sm font-medium text-white/90">
              <Sparkles className="h-3.5 w-3.5 text-warka-accent" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="border-y border-warka-border bg-warka-bg">
        <div className="mx-auto max-w-7xl px-2.5 py-3 sm:px-6 sm:py-6 lg:px-8">
          <ScrollRevealStagger className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {features.map((f) => (
              <ScrollRevealItem
                key={f.title}
                className="flex items-start gap-2.5 rounded-xl border border-warka-border bg-white p-3 shadow-sm sm:min-h-[112px] sm:gap-3 sm:rounded-[14px] sm:p-4"
              >
                <div className="flex aspect-square h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warka-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                  <f.icon className="h-4 w-4 text-warka-primary sm:h-5 sm:w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-warka-text">{f.title}</div>
                  <div className="text-xs text-warka-text-secondary">{f.desc}</div>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealStagger>
        </div>
      </section>

      <section className="bg-warka-bg py-5 sm:py-8 md:py-14">
        <div className="mx-auto max-w-3xl px-2.5 text-center sm:px-4">
          <ScrollReveal>
            <h2 className="mb-3 text-2xl font-bold text-warka-text sm:mb-4 sm:text-3xl lg:text-4xl">{t("philosophy.title")}</h2>
            <p className="mb-4 text-sm leading-relaxed text-warka-text-secondary sm:mb-6">{t("philosophy.body")}</p>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 font-medium text-warka-primary hover:underline"
            >
              {t("philosophy.cta")}
              <ChevronLeft className="h-4 w-4" />
            </a>
          </ScrollReveal>
        </div>

        <div className="mx-auto mt-4 max-w-7xl px-2.5 sm:mt-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {values.map((v) => (
              <ScrollReveal key={v.title} className="h-full">
                <div className="flex flex-col rounded-xl border border-warka-border bg-white p-3.5 shadow-sm sm:min-h-[220px] sm:rounded-[14px] sm:p-6 sm:transition-shadow sm:duration-300 sm:hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  <div className="mb-2 flex aspect-square h-9 w-9 items-center justify-center rounded-lg bg-warka-primary/10 sm:mb-4 sm:h-12 sm:w-12 sm:rounded-xl">
                    <v.icon className="h-5 w-5 text-warka-primary sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="mb-1.5 text-base font-bold text-warka-text sm:mb-2">{v.title}</h3>
                  <p className="text-sm leading-snug text-warka-text-secondary sm:leading-relaxed">{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="scroll-mt-16 bg-warka-bg py-5 sm:py-8 md:py-14">
        <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col items-center gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading title={tProducts("title")} subtitle={tProducts("subtitle")} className="mb-0" />
            <Link
              href="/products"
              className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-warka-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark sm:w-auto"
            >
              {tProducts("viewAll")}
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>

          {displayProducts.length === 0 ? (
            <ScrollReveal>
              <div className="rounded-[14px] border border-warka-border bg-card px-6 py-12 text-center shadow-card">
                <p className="text-warka-text-secondary">{tProducts("empty")}</p>
              </div>
            </ScrollReveal>
          ) : (
            <ScrollRevealStagger className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {displayProducts.map((p) => (
                  <ScrollRevealItem
                    key={p.key}
                    className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-warka-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
                  >
                    {p.isCustom ? (
                      <div className="flex aspect-[4/5] items-center justify-center border-b border-warka-border bg-warka-bg sm:aspect-square">
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
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <h3 className="mb-1 line-clamp-2 text-xs font-semibold leading-snug text-warka-text sm:text-base">
                        {p.name}
                      </h3>
                      <p className="mb-2 line-clamp-2 text-[11px] text-warka-text-secondary sm:mb-3 sm:text-sm">{p.price}</p>
                      <Link
                        href={`/products/${p.key}`}
                        className="mt-auto block w-full rounded-[10px] bg-warka-primary py-2 text-center text-[11px] font-semibold text-white transition-colors hover:bg-warka-primary-dark sm:py-2.5 sm:text-sm"
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

      <section id="how-it-works" className="scroll-mt-16 bg-warka-bg py-5 sm:py-8 md:py-14">
        <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8">
          <SectionHeading title={t("steps.title")} subtitle={t("steps.subtitle")} className="mb-8 sm:mb-12" />

          <div className="relative">
            <ScrollRevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
              {steps.map((s) => (
                <ScrollRevealItem key={s.num} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-4 flex aspect-square h-16 w-16 items-center justify-center rounded-xl border-2 border-warka-primary bg-white text-xl font-bold text-warka-primary shadow-sm">
                    {s.num}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-warka-text">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-warka-text-secondary">{s.desc}</p>
                </ScrollRevealItem>
              ))}
            </ScrollRevealStagger>
            <div className="pointer-events-none absolute top-8 right-[12.5%] left-[12.5%] hidden h-0.5 border-t-2 border-dashed border-warka-border lg:block" />
          </div>
        </div>
      </section>

      <section id="audience" className="scroll-mt-16 bg-warka-bg py-5 sm:py-8 md:py-14">
        <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8">
          <SectionHeading title={tRoles("title")} subtitle={tRoles("subtitle")} />

          <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3">
            {audiences.map((a) => (
              <ScrollReveal key={a.title} className="h-full">
                <div className="flex h-full flex-col rounded-xl border border-warka-border bg-white p-3.5 text-center shadow-sm sm:min-h-[260px] sm:rounded-[14px] sm:p-6 sm:transition-all sm:duration-300 sm:hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  <div className="mx-auto mb-3 flex aspect-square h-12 w-12 items-center justify-center rounded-xl bg-warka-primary/10 sm:mb-4 sm:h-14 sm:w-14">
                    <a.icon className="h-6 w-6 text-warka-primary sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-warka-text">{a.title}</h3>
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-warka-text-secondary">{a.desc}</p>
                  {a.href.startsWith("#") ? (
                    <a
                      href={a.href}
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-[10px] border-2 border-warka-primary px-5 py-2.5 text-sm font-semibold text-warka-primary transition-all duration-200 hover:bg-warka-primary hover:text-white"
                    >
                      {a.cta}
                      <ArrowLeft className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link
                      href={a.href}
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-[10px] border-2 border-warka-primary px-5 py-2.5 text-sm font-semibold text-warka-primary transition-all duration-200 hover:bg-warka-primary hover:text-white"
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

      <section className="bg-warka-primary py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <ScrollReveal>
            <h2 className="mb-4 text-2xl font-bold text-white lg:text-3xl">{t("ctaStrip.title")}</h2>
            <div className="mb-8 flex flex-wrap justify-center gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-warka-accent" />
                {t("ctaStrip.bullets.1")}
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-warka-accent" />
                {t("ctaStrip.bullets.2")}
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-warka-accent" />
                {t("ctaStrip.bullets.3")}
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="rounded-[10px] bg-card px-6 py-3 text-sm font-semibold text-warka-primary transition-colors hover:bg-warka-bg"
              >
                {t("ctaStrip.ctaPrimary")}
              </Link>
              <a
                href="#contact"
                className="rounded-[10px] border-2 border-card px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-card/10"
              >
                {t("ctaStrip.ctaSecondary")}
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section id="contact" className="scroll-mt-16 bg-warka-bg py-5 sm:py-8 md:py-14">
        <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8">
          <SectionHeading title={tContact("title")} subtitle={tContact("subtitle")} />

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
            <ScrollReveal className="landing-contact-card flex flex-col items-center justify-center rounded-xl border border-warka-border p-3.5 text-center shadow-sm sm:min-h-[172px] sm:rounded-[14px] sm:p-6">
              <div className="mx-auto mb-3 flex aspect-square h-12 w-12 items-center justify-center rounded-xl bg-warka-primary/10">
                <Phone className="h-5 w-5 text-warka-primary" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">{tContact("phone")}</h3>
              <a
                href={`tel:${SITE_CONTACT.phoneE164}`}
                className="text-sm"
                dir="ltr"
              >
                {SITE_CONTACT.phoneDisplay}
              </a>
            </ScrollReveal>

            <ScrollReveal delay={0.09} className="landing-contact-card flex flex-col items-center justify-center rounded-xl border border-warka-border p-3.5 text-center shadow-sm sm:min-h-[172px] sm:rounded-[14px] sm:p-6">
              <div className="mx-auto mb-3 flex aspect-square h-12 w-12 items-center justify-center rounded-xl bg-warka-primary/10">
                <Mail className="h-5 w-5 text-warka-primary" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">{tContact("email")}</h3>
              <a href={`mailto:${SITE_CONTACT.email}`} className="text-sm">
                {SITE_CONTACT.email}
              </a>
            </ScrollReveal>

            <ScrollReveal delay={0.18} className="landing-contact-card flex flex-col items-center justify-center rounded-xl border border-warka-border p-3.5 text-center shadow-sm sm:min-h-[172px] sm:rounded-[14px] sm:p-6">
              <div className="mx-auto mb-3 flex aspect-square h-12 w-12 items-center justify-center rounded-xl bg-warka-primary/10">
                <MapPin className="h-5 w-5 text-warka-primary" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">{tContact("address")}</h3>
              <p className="text-sm">{tContact("addressValue")}</p>
            </ScrollReveal>
          </div>

          <div className="mt-8 text-center">
            <Link
              href={orderHref}
              className="inline-flex items-center gap-2 rounded-[10px] bg-warka-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark"
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
