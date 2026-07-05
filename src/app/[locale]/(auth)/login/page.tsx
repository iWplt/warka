import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/features/auth/login-form";
import { isLocalAuthEnabled } from "@/lib/auth/local-session";
import { getSetupStatus } from "@/server/actions/setup";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return {
    title: t("loginSeoTitle"),
    description: t("loginSubtitle"),
  };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const localMode = isLocalAuthEnabled();

  if (!localMode) {
    const status = await getSetupStatus();
    if (status.needsBootstrap) {
      redirect(`/${locale}/setup`);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <Suspense
        fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-card shadow-card" />}
      >
        <LoginForm localMode={localMode} />
      </Suspense>
    </div>
  );
}
