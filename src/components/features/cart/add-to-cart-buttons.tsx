"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { TrustBadges } from "@/components/features/cart/trust-badges";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { dispatchCartPulse } from "@/lib/cart/cart-pulse";
import { useCartStore, type AddCartItemInput } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

type AddToCartButtonsProps = {
  item: AddCartItemInput;
  className?: string;
};

export function AddToCartButtons({ item, className }: AddToCartButtonsProps) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const reducedMotion = useReducedMotion();
  const [adding, setAdding] = useState(false);

  const tapProps = reducedMotion
    ? {}
    : {
        whileTap: { scale: 0.97 },
        transition: { duration: 0.15 },
      };

  const handleAdd = (thenCheckout: boolean) => {
    setAdding(true);
    try {
      addItem(item);
      dispatchCartPulse();
      if (thenCheckout) {
        router.push("/checkout?from=cart");
        return;
      }
      toast.success(t("added"), {
        action: {
          label: t("viewCart"),
          onClick: () => router.push("/cart"),
        },
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <motion.button
          type="button"
          disabled={adding}
          onClick={() => handleAdd(false)}
          {...tapProps}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] border-2 border-warka-primary bg-white py-3.5 text-sm font-semibold text-warka-primary transition-all hover:bg-warka-primary/5 disabled:opacity-60"
        >
          <ShoppingBag className="size-4" />
          {t("addToCart")}
        </motion.button>
        <motion.button
          type="button"
          disabled={adding}
          onClick={() => handleAdd(true)}
          {...tapProps}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-warka-primary py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-all hover:bg-warka-primary-dark disabled:opacity-60"
        >
          <Zap className="size-4" />
          {locale === "ar" ? "اشتري الآن" : "Buy now"}
        </motion.button>
      </div>
      <TrustBadges />
    </div>
  );
}
