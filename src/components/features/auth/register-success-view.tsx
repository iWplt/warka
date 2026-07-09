"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WARKA_MARK_PATH } from "@/lib/constants/brand";
import { isValidStudentAccessCode, normalizeAccessCode } from "@/lib/auth/access-code";

export function RegisterSuccessView() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const rawCode = searchParams.get("code") ?? "";
  const code = normalizeAccessCode(rawCode);
  const valid = isValidStudentAccessCode(code);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!valid) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(t("codeCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  if (!valid) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-card">
        <p className="text-warka-text-secondary">{t("invalidAccessCode")}</p>
        <Link href={`/${locale}/register`} className="mt-4 inline-block text-warka-primary hover:underline">
          {t("register")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-2xl bg-card p-8 shadow-card">
      <div className="mb-6 text-center">
        <Image
          src={WARKA_MARK_PATH}
          alt="WARKA"
          width={64}
          height={64}
          className="mx-auto h-14 w-14 object-contain"
        />
        <CheckCircle2 className="mx-auto mt-4 size-10 text-warka-primary" />
        <h1 className="mt-4 text-xl font-bold text-warka-text">{t("registerSuccessTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-warka-text-secondary">{t("registerSuccessHint")}</p>
      </div>

      <div className="rounded-2xl border-2 border-warka-primary/30 bg-warka-primary/5 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-warka-text-secondary">
          {t("yourAccessCode")}
        </p>
        <p className="mt-2 font-mono text-2xl font-bold tracking-wider text-warka-primary" dir="ltr">
          {code}
        </p>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-warka-primary px-4 py-2 text-sm font-semibold text-white hover:bg-warka-primary-dark"
        >
          <Copy className="size-4" />
          {copied ? t("codeCopied") : t("copyCode")}
        </button>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-warka-text-secondary">
        <li>• {t("saveCodeTip1")}</li>
        <li>• {t("saveCodeTip2")}</li>
        <li>• {t("saveCodeTip3")}</li>
      </ul>

      <Link
        href={`/${locale}/login`}
        className="mt-8 block w-full rounded-xl bg-warka-primary py-3 text-center text-sm font-semibold text-white hover:bg-warka-primary-dark"
      >
        {t("goToLogin")}
      </Link>
    </div>
  );
}
