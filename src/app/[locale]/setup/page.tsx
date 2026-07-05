import { Suspense } from "react";
import { getSetupStatus } from "@/server/actions/setup";
import { SetupForm } from "@/components/features/auth/setup-form";
import { getSupabaseConfig } from "@/lib/env";
import { redirect } from "next/navigation";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!getSupabaseConfig()) {
    redirect(`/${locale}/login?error=config`);
  }

  const status = await getSetupStatus();

  if (!status.needsBootstrap) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-warka-bg px-4 py-12">
      <Suspense
        fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-card shadow-card" />}
      >
        <SetupForm />
      </Suspense>
    </div>
  );
}
