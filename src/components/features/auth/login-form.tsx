"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { GraduationCap, Mail } from "lucide-react";
import { signIn } from "@/server/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/layouts/language-switcher";
import { WARKA_MARK_PATH, WARKA_TAGLINE_AR, WARKA_TAGLINE_EN } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  localMode?: boolean;
};

function Alert({ children, variant }: { children: React.ReactNode; variant: "error" | "info" }) {
  const styles =
    variant === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-warka-primary/20 bg-warka-primary/10 text-warka-primary";
  return <p className={`mb-4 rounded-lg border p-3 text-sm font-medium ${styles}`}>{children}</p>;
}

export function LoginForm({ localMode = false }: LoginFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const error = mounted ? searchParams.get("error") : null;
  const redirect = mounted ? searchParams.get("redirect") : null;
  const message = mounted ? searchParams.get("message") : null;
  const tagline = locale === "ar" ? WARKA_TAGLINE_AR : WARKA_TAGLINE_EN;
  const [mode, setMode] = useState<"student" | "email">("student");

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearAuthErrors = () => {
    if (!searchParams.get("error")) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("error");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const switchMode = (nextMode: "student" | "email") => {
    setMode(nextMode);
    clearAuthErrors();
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <Image
            src={WARKA_MARK_PATH}
            alt="WARKA"
            width={72}
            height={72}
            className="mx-auto h-16 w-16 object-contain"
            priority
          />
          <div>
            <span className="font-display text-2xl font-bold tracking-wide text-warka-text">WARKA</span>
            <p className="mt-1 text-xs text-warka-text-muted">{tagline}</p>
          </div>
        </Link>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div className="text-center sm:text-right">
            <h1 className="mb-1 text-xl font-bold text-warka-text">{t("loginTitle")}</h1>
            <p className="text-sm font-medium text-warka-text-secondary">{t("loginSubtitle")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        {localMode && <Alert variant="info">{t("localModeHint")}</Alert>}
        {error === "disabled" && <Alert variant="error">{t("accountDisabled")}</Alert>}
        {error === "rate-limit" && <Alert variant="error">{t("rateLimited")}</Alert>}
        {error === "invalid" && <Alert variant="error">{t("invalidCredentials")}</Alert>}
        {error === "invalid-code" && <Alert variant="error">{t("invalidAccessCode")}</Alert>}
        {error === "phone-mismatch" && <Alert variant="error">{t("phoneMismatch")}</Alert>}
        {error === "config" && <Alert variant="error">{t("configError")}</Alert>}
        {error === "profile" && <Alert variant="error">{t("profileError")}</Alert>}
        {message === "confirm-email" && (
          <Alert variant="info">{t("confirmEmail")}</Alert>
        )}
        {message === "admin-ready" && (
          <Alert variant="info">{t("adminReady")}</Alert>
        )}

        {!localMode && (
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-warka-surface p-1">
            <button
              type="button"
              onClick={() => switchMode("student")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                mode === "student" ? "bg-card text-warka-primary shadow-sm" : "text-warka-text-secondary"
              )}
            >
              <GraduationCap className="size-4" />
              {t("studentLogin")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("email")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                mode === "email" ? "bg-card text-warka-primary shadow-sm" : "text-warka-text-secondary"
              )}
            >
              <Mail className="size-4" />
              {t("emailLogin")}
            </button>
          </div>
        )}

        <form action={signIn} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          {redirect ? <input type="hidden" name="redirect" value={redirect} /> : null}
          <input type="hidden" name="loginMode" value={localMode ? "email" : mode === "student" ? "student-code" : "email"} />

          {!localMode && mode === "student" ? (
            <>
              <div>
                <Label htmlFor="accessCode" className="mb-1.5 block text-sm font-semibold text-warka-text">
                  {t("accessCode")}
                </Label>
                <Input
                  id="accessCode"
                  name="accessCode"
                  required
                  dir="ltr"
                  placeholder="WARKA-XXXX-XX"
                  className="warka-input font-mono uppercase"
                />
              </div>
              <div>
                <Label htmlFor="phoneLast4" className="mb-1.5 block text-sm font-semibold text-warka-text">
                  {t("phoneLast4")}
                </Label>
                <Input
                  id="phoneLast4"
                  name="phoneLast4"
                  dir="ltr"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="1234"
                  className="warka-input font-mono"
                />
                <p className="mt-1.5 text-xs text-warka-text-secondary">{t("phoneLast4Hint")}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="login-identifier" className="mb-1.5 block text-sm font-semibold text-warka-text">
                  {localMode ? t("username") : t("email")}
                </Label>
                <Input
                  id="login-identifier"
                  name={localMode ? "username" : "email"}
                  type={localMode ? "text" : "email"}
                  required
                  autoComplete="username"
                  dir="ltr"
                  className="warka-input"
                />
              </div>
              <div>
                <Label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-warka-text">
                  {t("password")}
                </Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="warka-input"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-warka-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-warka-primary-dark"
          >
            {t("loginButton")}
          </button>
        </form>

        {!localMode && (
          <p className="mt-6 text-center text-sm text-warka-text-secondary">
            {t("noAccount")}{" "}
            <Link href="/register" className="font-medium text-warka-primary hover:underline">
              {t("register")}
            </Link>
          </p>
        )}

        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-warka-text-muted hover:text-warka-text">
            {t("backToHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}
