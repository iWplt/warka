import Image from "next/image";
import { getLocale } from "next-intl/server";
import { WifiOff, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/routing";
import { WARKA_MARK_PATH } from "@/lib/constants/brand";

export default async function OfflinePage() {
  const locale = (await getLocale()) as "ar" | "en";
  const isAr = locale === "ar";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-warka-bg p-6 font-arabic text-center">
      <Image
        src={WARKA_MARK_PATH}
        alt="WARKA"
        width={72}
        height={72}
        className="h-[72px] w-[72px] object-contain opacity-70"
      />

      <div className="flex size-16 items-center justify-center rounded-2xl bg-[#FF9800]/10">
        <WifiOff className="size-8 text-[#FF9800]" aria-hidden />
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-bold text-warka-text">
          {isAr ? "أنت غير متصل" : "You are offline"}
        </h1>
        <p className="text-sm leading-relaxed text-warka-text-secondary">
          {isAr
            ? "لا يمكن تحميل هذه الصفحة بدون اتصال بالإنترنت. تحقق من شبكتك ثم حاول مجدداً."
            : "This page cannot load without an internet connection. Check your network and try again."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-warka-primary px-6 py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark"
        >
          <RefreshCw className="size-4" />
          {isAr ? "العودة للرئيسية" : "Back to home"}
        </Link>
      </div>

      <p className="text-xs text-warka-text-muted">
        {isAr
          ? "بعض الصفحات المحفوظة قد تظل متاحة بدون اتصال."
          : "Some cached pages may still be available offline."}
      </p>
    </div>
  );
}
