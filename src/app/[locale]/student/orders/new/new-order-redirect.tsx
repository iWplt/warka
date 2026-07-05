"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useCartStore } from "@/stores/cart-store";
import { useOrderWizardStore } from "@/stores/order-wizard-store";

export function NewOrderRedirect() {
  const t = useTranslations("studentOrder");
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const resetWizard = useOrderWizardStore((s) => s.reset);

  useEffect(() => {
    clearCart();
    resetWizard();
    router.replace("/products?new=1");
  }, [clearCart, resetWizard, router]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16">
      <Loader2 className="size-10 animate-spin text-warka-primary" aria-hidden />
      <p className="text-center text-sm font-medium text-warka-text-secondary">
        {t("newOrderRedirect")}
      </p>
    </div>
  );
}
