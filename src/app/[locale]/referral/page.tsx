"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  Copy,
  Check,
  Share2,
  Users,
  ShoppingBag,
  Gift,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WarkaCard, WarkaCardTitle } from "@/components/ui/warka-card";
import { Link } from "@/i18n/routing";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { buildWhatsAppUrl } from "@/lib/constants/iraq-market";
import { cn } from "@/lib/utils";

const MOCK_STATS = {
  referrals: 12,
  signups: 5,
  earnedIqd: 75000,
  pendingIqd: 25000,
};

function useReferralLink() {
  const locale = useLocale();
  const [code] = useState(() => `WARKA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);

  return useMemo(() => {
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    return `${base}/${locale}/register?ref=${code}`;
  }, [locale, code]);
}

export default function ReferralPage() {
  const locale = useLocale() as "ar" | "en";
  const isAr = locale === "ar";
  const referralLink = useReferralLink();
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(isAr ? "تم نسخ الرابط" : "Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isAr ? "تعذّر النسخ" : "Could not copy");
    }
  }, [referralLink, isAr]);

  const shareMessage = isAr
    ? `انضم إلى WARKA — متجر طباعة التخرج:\n${referralLink}`
    : `Join WARKA — graduation printing store:\n${referralLink}`;

  const shareTargets = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: buildWhatsAppUrl(shareMessage),
      className: "bg-[#25D366] hover:bg-[#20BD5A] text-white",
      icon: MessageCircle,
    },
    {
      id: "twitter",
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
      className: "bg-warka-primary hover:bg-warka-primary-dark text-white",
      icon: Share2,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      className: "bg-[#1877F2] hover:bg-[#166FE5] text-white",
      icon: Share2,
    },
  ];

  const statCards = [
    {
      icon: Users,
      label: isAr ? "إحالات" : "Referrals",
      value: MOCK_STATS.referrals,
    },
    {
      icon: ShoppingBag,
      label: isAr ? "تسجيلات" : "Sign-ups",
      value: MOCK_STATS.signups,
    },
    {
      icon: Gift,
      label: isAr ? "أرباح (د.ع)" : "Earned (IQD)",
      value: MOCK_STATS.earnedIqd.toLocaleString(isAr ? "ar-IQ" : "en-IQ"),
    },
  ];

  return (
    <div className="min-h-screen bg-warka-bg font-arabic pb-16">
      <header className="border-b border-warka-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/">
            <BrandLockup layout="header" />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-warka-text-secondary hover:text-warka-text"
          >
            {isAr ? "الرئيسية" : "Home"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-warka-text">
            {isAr ? "برنامج الإحالة" : "Referral program"}
          </h1>
          <p className="mt-2 text-sm text-warka-text-secondary">
            {isAr
              ? "شارك رابطك مع زملائك واكسب مكافآت على كل طلب جماعي."
              : "Share your link with classmates and earn rewards on every group order."}
          </p>
        </div>

        <WarkaCard className="mb-6">
          <WarkaCardTitle className="mb-3">
            {isAr ? "رابط الإحالة الخاص بك" : "Your referral link"}
          </WarkaCardTitle>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div
              dir="ltr"
              className="min-w-0 flex-1 truncate rounded-lg border border-warka-border bg-warka-bg/50 px-3 py-2.5 text-sm text-warka-text"
            >
              {referralLink}
            </div>
            <Button type="button" onClick={copyLink} className="min-h-[44px] shrink-0 gap-2">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? (isAr ? "تم النسخ" : "Copied") : isAr ? "نسخ الرابط" : "Copy link"}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {shareTargets.map((target) => (
              <a
                key={target.id}
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 text-xs font-semibold transition-opacity hover:opacity-90",
                  target.className
                )}
              >
                <target.icon className="size-4" />
                {target.label}
              </a>
            ))}
          </div>
        </WarkaCard>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {statCards.map((stat) => (
            <WarkaCard key={stat.label} className="text-center">
              <stat.icon className="mx-auto mb-2 size-5 text-warka-primary" />
              <p className="text-2xl font-bold text-warka-text">{stat.value}</p>
              <p className="text-xs text-warka-text-muted">{stat.label}</p>
            </WarkaCard>
          ))}
        </div>

        <WarkaCard className="border-dashed border-warka-primary/30 bg-warka-primary/5">
          <p className="text-sm text-warka-text-secondary">
            {isAr ? (
              <>
                <span className="font-semibold text-warka-text">قيد الانتظار: </span>
                {MOCK_STATS.pendingIqd.toLocaleString("ar-IQ")} د.ع — تُفعَّل بعد أول طلب مكتمل
                من إحالتك.
              </>
            ) : (
              <>
                <span className="font-semibold text-warka-text">Pending: </span>
                {MOCK_STATS.pendingIqd.toLocaleString("en-IQ")} IQD — unlocked after your first
                completed referral order.
              </>
            )}
          </p>
        </WarkaCard>
      </main>
    </div>
  );
}
