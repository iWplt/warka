import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/layouts/query-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { env } from "@/lib/env";

const IRAQ_SEO_KEYWORDS = [
  "مطبوعات تخرج بغداد",
  "وشاح تخرج البصرة",
  "روب تخرج النجف",
  "مستلزمات تخرج كربلاء",
  "طباعة تخرج الموصل",
  "WARKA graduation Iraq",
].join(", ");

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "WARKA | وشاح تخرج بغداد - روب تخرج - قبعة تخرج",
    template: "%s | WARKA",
  },
  description:
    "متجر طباعة التخرج في العراق — وشاح، روب، قبعة، بدلة. توصيل لبغداد والبصرة والموصل.",
  keywords: IRAQ_SEO_KEYWORDS,
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/assets/brand/warka-mark-v3.png", type: "image/png" }],
    apple: "/assets/brand/warka-mark-v3.png",
    shortcut: "/assets/brand/warka-mark-v3.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WARKA",
  },
};

export const viewport: Viewport = {
  themeColor: "#5C5C47",
};

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = routing.locales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : null;

  if (!locale) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <QueryProvider>
      {children}
      <ToastProvider />
    </QueryProvider>
  );
}
