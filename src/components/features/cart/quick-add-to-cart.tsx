"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { buildDefaultCartItemFromProduct } from "@/lib/cart/build-item";
import { dispatchCartPulse } from "@/lib/cart/cart-pulse";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/database";
import { cn } from "@/lib/utils";

type QuickAddToCartProps = {
  product: Product;
  locale: "ar" | "en";
  className?: string;
};

export function QuickAddToCart({ product, locale, className }: QuickAddToCartProps) {
  const t = useTranslations("cart");
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

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      addItem(buildDefaultCartItemFromProduct(product, locale));
      dispatchCartPulse();
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
    <motion.button
      type="button"
      disabled={adding}
      onClick={handleAdd}
      {...tapProps}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-[10px] border-2 border-warka-border bg-card py-2.5 text-sm font-semibold text-warka-text transition-all hover:border-warka-primary hover:text-warka-primary disabled:opacity-60",
        className
      )}
    >
      <ShoppingBag className="size-4" />
      {t("addToCart")}
    </motion.button>
  );
}
