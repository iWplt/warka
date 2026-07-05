import { Suspense } from "react";
import { RegisterSuccessView } from "@/components/features/auth/register-success-view";

export default function RegisterSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warka-surface px-4 py-12 font-arabic">
      <Suspense fallback={<div className="h-64 w-full max-w-lg animate-pulse rounded-2xl bg-card" />}>
        <RegisterSuccessView />
      </Suspense>
    </div>
  );
}
