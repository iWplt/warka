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
import type { PriceCatalogItem, Product, Profile } from "@/types/database";

type WarkaLandingProps = {
  prices: PriceCatalogItem[];
  catalogProducts?: Product[];
  profile: Profile | null;
  dashboardPath?: string;
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

function getFeaturedProductIndex(products: LandingProduct[]): number {
  const customIndex = products.findIndex((p) => p.isCustom);
  return customIndex >= 0 ? customIndex : 0;
}

export function WarkaLanding({ prices, catalogProducts = [], profile, dashboardPath }: WarkaLandingProps) {
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

  if (catalogActive.length > 0) {
    for (const p of catalogActive) {
      const meta = GRADUATION_PRODUCT_META.find((m) => m.productType === p.product_type);
      const isCustom = p.product_type === "custom";
      products.push({
        key: p.id,
        name: locale === "ar" ? p.name_ar : p.name_en,
        price: isCustom
          ? tProducts("items.custom.description")
          : tProducts("priceFrom", { price: formatIqd(Number(p.price), locale) }),
        image: p.image || meta?.image || LANDING_IMAGES.products.custom,
        isCustom,
      });
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

  const featuredIndex = products.length > 1 ? getFeaturedProductIndex(products) : -1;

  const displayProducts =
    featuredIndex > 0
      ? [
          products[featuredIndex],
          ...products.slice(0, featuredIndex),
          ...products.slice(featuredIndex + 1),
        ]
      : products;

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

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="text-start lg:pe-4">
              <span className="mb-3 inline-flex rounded-full bg-warka-primary/10 px-3 py-1 text-xs font-semibold text-warka-primary">
                {t("hero.kicker")}
              </span>
              <h1 className="mb-4 text-3xl leading-[1.12] font-bold text-warka-text sm:text-4xl lg:text-5xl xl:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="mb-8 max-w-lg text-sm leading-relaxed text-warka-text-muted sm:text-base">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={isAuthenticated && dashboardPath ? dashboardPath : orderHref}
                  className="rounded-[10px] bg-warka-primary px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:bg-warka-primary-dark hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] sm:w-auto"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <a
                  href="#products"
                  className="rounded-[10px] border-2 border-warka-primary px-6 py-3 text-center text-sm font-semibold text-warka-primary transition-all duration-200 hover:bg-warka-primary hover:text-white sm:w-auto"
                >
                  {t("hero.ctaSecondary")}
                </a>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 border-t border-warka-border pt-6 sm:mt-10 sm:justify-start sm:gap-8 sm:border-0 sm:pt-0">
                <div className="text-center sm:text-start">
                  <div className="text-2xl font-bold text-warka-text">2.4k+</div>
                  <div className="mt-1 text-xs text-warka-text-muted">{t("hero.statOrders")}</div>
                </div>
                <div className="h-8 w-px bg-warka-border" />
                <div className="text-center sm:text-start">
                  <div className="text-2xl font-bold text-warka-text">98%</div>
                  <div className="mt-1 text-xs text-warka-text-muted">{t("hero.statSatisfaction")}</div>
                </div>
                <div className="h-8 w-px bg-warka-border" />
                <div className="text-center sm:text-start">
                  <div className="text-2xl font-bold text-warka-text">48h</div>
                  <div className="mt-1 text-xs text-warka-text-muted">{t("hero.statDelivery")}</div>
                </div>
              </div>
            </div>

            <div className="relative lg:ps-4">
              <div className="relative overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
                <Image
                  src={LANDING_IMAGES.hero}
                  alt={t("hero.imageAlt")}
                  width={800}
                  height={600}
                  className="aspect-[4/3] h-auto w-full object-cover lg:aspect-auto"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 hidden rounded-xl bg-white/90 p-3 text-center backdrop-blur-sm sm:block">
                  <p className="text-xs text-warka-text-secondary">{t("hero.floatingCaption")}</p>
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

      <section className="border-y border-warka-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <ScrollRevealStagger className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {features.map((f) => (
              <ScrollRevealItem key={f.title} className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warka-bg">
                  <f.icon className="h-5 w-5 text-warka-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-warka-text">{f.title}</div>
                  <div className="text-xs text-warka-text-muted">{f.desc}</div>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealStagger>
        </div>
      </section>

      <section className="bg-warka-bg py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <ScrollReveal>
            <h2 className="mb-4 text-3xl font-bold text-warka-text lg:text-4xl">{t("philosophy.title")}</h2>
            <p className="mb-6 text-sm leading-relaxed text-warka-text-muted">{t("philosophy.body")}</p>
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

      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <ScrollReveal key={v.title}>
                <div className="rounded-[14px] bg-warka-bg p-6 transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-warka-primary/10">
                    <v.icon className="h-6 w-6 text-warka-primary" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-warka-text">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-warka-text-secondary">{v.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="scroll-mt-16 bg-warka-bg py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={tProducts("title")} subtitle={tProducts("subtitle")} />

          {products.length === 0 ? (
            <ScrollReveal>
              <div className="rounded-[14px] border border-warka-border bg-white px-6 py-12 text-center shadow-card">
                <p className="text-warka-text-secondary">{tProducts("empty")}</p>
              </div>
            </ScrollReveal>
          ) : (
            <ScrollRevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {displayProducts.map((p) => (
                  <ScrollRevealItem
                    key={p.key}
                    className="group flex flex-col overflow-hidden rounded-[14px] bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
                  >
                    {p.isCustom ? (
                      <div className="m-4 flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-warka-border bg-warka-bg">
                        <div className="text-center">
                          <Palette className="mx-auto mb-2 h-10 w-10 text-warka-primary" />
                          <span className="text-sm text-warka-text-secondary">
                            {tProducts("items.custom.title")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square overflow-hidden bg-warka-bg">
                        <Image
                          src={p.image}
                          alt={p.name}
                          width={400}
                          height={400}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="mb-1 text-base font-semibold text-warka-text">
                        {p.name}
                      </h3>
                      <p className="mb-3 text-sm text-warka-text-secondary">{p.price}</p>
                      <Link
                        href={`/products/${p.key}`}
                        className="mt-auto block w-full rounded-[10px] bg-warka-primary py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark"
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

      <section id="how-it-works" className="scroll-mt-16 bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t("steps.title")} subtitle={t("steps.subtitle")} className="mb-12" />

          <div className="relative">
            <ScrollRevealStagger className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <ScrollRevealItem key={s.num} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-warka-primary bg-white text-xl font-bold text-warka-primary">
                    {s.num}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-warka-text">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-warka-text-muted">{s.desc}</p>
                </ScrollRevealItem>
              ))}
            </ScrollRevealStagger>
            <div className="pointer-events-none absolute top-8 right-[12.5%] left-[12.5%] hidden h-0.5 border-t-2 border-dashed border-warka-border lg:block" />
          </div>
        </div>
      </section>

      <section id="audience" className="scroll-mt-16 bg-warka-bg py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={tRoles("title")} subtitle={tRoles("subtitle")} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {audiences.map((a) => (
              <ScrollReveal key={a.title} className="h-full">
                <div className="flex h-full flex-col rounded-[14px] bg-white p-6 text-center shadow-card transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warka-primary/10">
                    <a.icon className="h-7 w-7 text-warka-primary" />
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

      <section className="bg-warka-primary py-14">
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
                className="rounded-[10px] bg-white px-6 py-3 text-sm font-semibold text-warka-primary transition-colors hover:bg-warka-bg"
              >
                {t("ctaStrip.ctaPrimary")}
              </Link>
              <a
                href="#contact"
                className="rounded-[10px] border-2 border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t("ctaStrip.ctaSecondary")}
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section id="contact" className="scroll-mt-16 bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={tContact("title")} subtitle={tContact("subtitle")} />

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
            <ScrollReveal className="rounded-[14px] bg-warka-bg p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warka-primary/10">
                <Phone className="h-5 w-5 text-warka-primary" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-warka-text">{tContact("phone")}</h3>
              <a
                href={`tel:${SITE_CONTACT.phoneE164}`}
                className="text-sm text-warka-text-secondary"
                dir="ltr"
              >
                {SITE_CONTACT.phoneDisplay}
              </a>
            </ScrollReveal>

            <ScrollReveal delay={0.09} className="rounded-[14px] bg-warka-bg p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warka-primary/10">
                <Mail className="h-5 w-5 text-warka-primary" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-warka-text">{tContact("email")}</h3>
              <a href={`mailto:${SITE_CONTACT.email}`} className="text-sm text-warka-text-secondary">
                {SITE_CONTACT.email}
              </a>
            </ScrollReveal>

            <ScrollReveal delay={0.18} className="rounded-[14px] bg-warka-bg p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warka-primary/10">
                <MapPin className="h-5 w-5 text-warka-primary" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-warka-text">{tContact("address")}</h3>
              <p className="text-sm text-warka-text-secondary">{tContact("addressValue")}</p>
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
