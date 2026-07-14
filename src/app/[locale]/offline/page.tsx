import { getLocale } from "next-intl/server";
import { WifiOff, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/routing";
import { BrandLockup } from "@/components/brand/brand-lockup";

export default async function OfflinePage() {
  const locale = (await getLocale()) as "ar" | "en";
  const isAr = locale === "ar";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-warka-bg p-6 font-arabic text-center">
      <BrandLockup layout="auth" className="opacity-70" />

      <div className="flex size-14 items-center justify-center rounded-[var(--radius-card)] bg-[#FF9800]/10 sm:size-16">
        <WifiOff className="size-7 text-[#FF9800] sm:size-8" aria-hidden />
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="page-title">
          {isAr ? "أنت غير متصل" : "You are offline"}
        </h1>
        <p className="page-description mx-auto">
          {isAr
            ? "لا يمكن تحميل هذه الصفحة بدون اتصال بالإنترنت. تحقق من شبكتك ثم حاول مجدداً."
            : "This page cannot load without an internet connection. Check your network and try again."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-warka-primary px-6 py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark"
        >
          <RefreshCw className="size-4" />
          {isAr ? "العودة للرئيسية" : "Back to home"}
        </Link>
      </div>

      <p className="text-caption">
        {isAr
          ? "بعض الصفحات المحفوظة قد تظل متاحة بدون اتصال."
          : "Some cached pages may still be available offline."}
      </p>
    </div>
  );
}
