import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.56.1", "192.168.0.174"],
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/assets/brand/warka-mark.png",
        permanent: false,
      },
      {
        source: "/preview/warka-receipt-sample.svg",
        destination: "/previews/warka-receipt-sample.svg",
        permanent: false,
      },
      {
        source: "/preview/warka-receipt-sample.html",
        destination: "/previews/warka-receipt-sample.html",
        permanent: false,
      },
    ];
  },
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default withNextIntl(nextConfig);
