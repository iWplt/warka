import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/auth/login-form";
import { isLocalAuthEnabled } from "@/lib/auth/local-session";
import { getSetupStatus } from "@/server/actions/setup";

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
        fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-white shadow-card" />}
      >
        <LoginForm localMode={localMode} />
      </Suspense>
    </div>
  );
}
