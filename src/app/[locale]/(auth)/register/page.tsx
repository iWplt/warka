import { Suspense } from "react";
import { RegisterForm } from "@/components/features/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-warka-bg px-4 py-12">
      <Suspense
        fallback={<div className="h-[520px] w-full max-w-lg animate-pulse rounded-2xl bg-white shadow-card" />}
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
