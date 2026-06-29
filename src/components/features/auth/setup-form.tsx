"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { bootstrapFirstAdmin } from "@/server/actions/setup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WARKA_LOGO_PATH, WARKA_TAGLINE_AR, WARKA_TAGLINE_EN } from "@/lib/constants/brand";

export function SetupForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const tagline = locale === "ar" ? WARKA_TAGLINE_AR : WARKA_TAGLINE_EN;

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <Image src={WARKA_LOGO_PATH} alt="WARKA" width={64} height={64} className="h-16 w-16" priority />
          <span className="font-display text-2xl font-bold tracking-wide text-warka-text">WARKA</span>
          <p className="text-xs text-warka-text-muted">{tagline}</p>
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h1 className="mb-1 text-center text-xl font-bold text-warka-text">{t("setupTitle")}</h1>
        <p className="mb-6 text-center text-sm text-warka-text-secondary">{t("setupSubtitle")}</p>

        {error === "invalid" && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {t("setupError")}
          </p>
        )}
        {error === "profile" && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {t("setupProfileError")}
          </p>
        )}

        <form action={bootstrapFirstAdmin} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div>
            <Label htmlFor="setup-name" className="mb-1.5 block text-sm font-medium text-warka-text">
              {t("fullName")}
            </Label>
            <Input id="setup-name" name="fullName" required minLength={2} className="border-warka-border" />
          </div>
          <div>
            <Label htmlFor="setup-email" className="mb-1.5 block text-sm font-medium text-warka-text">
              {t("email")}
            </Label>
            <Input id="setup-email" name="email" type="email" required dir="ltr" className="border-warka-border" />
          </div>
          <div>
            <Label htmlFor="setup-password" className="mb-1.5 block text-sm font-medium text-warka-text">
              {t("password")}
            </Label>
            <Input
              id="setup-password"
              name="password"
              type="password"
              required
              minLength={8}
              className="border-warka-border"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-warka-primary py-3 text-sm font-semibold text-white hover:bg-warka-primary-dark"
          >
            {t("setupButton")}
          </button>
        </form>
      </div>
    </div>
  );
}
