"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Zap, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { TrustBadges } from "@/components/features/cart/trust-badges";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { dispatchCartPulse } from "@/lib/cart/cart-pulse";
import { flushCartPersist, flushAndNavigate } from "@/lib/cart/persist-flush";
import { useCartStore, type AddCartItemInput } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

type AddToCartButtonsProps = {
  item: AddCartItemInput;
  className?: string;
  requiresSize?: boolean;
  selectedSize?: string;
  customMeasurements?: string;
  sizeIsComplete?: boolean;
};

export function AddToCartButtons({
  item,
  className,
  requiresSize = false,
  selectedSize = "",
  customMeasurements = "",
  sizeIsComplete,
}: AddToCartButtonsProps) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const reducedMotion = useReducedMotion();
  const [adding, setAdding] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);

  const tapProps = reducedMotion
    ? {}
    : {
        whileTap: { scale: 0.97 },
        transition: { duration: 0.15 },
      };

  const handleAdd = (
    thenCheckout: boolean,
    event?: { preventDefault: () => void; stopPropagation: () => void }
  ) => {
    event?.preventDefault();
    event?.stopPropagation();

    const complete =
      sizeIsComplete ?? Boolean(selectedSize.trim() || customMeasurements.trim());
    if (requiresSize && !complete) {
      toast.error(
        locale === "ar"
          ? "يرجى اختيار المقاس أو إدخال قياساتك"
          : "Please select a size or enter your measurements"
      );
      return;
    }
    if (adding) return; // guard against double-click / double-submit
    setAdding(true);
    addItem(item);
    dispatchCartPulse();

    if (!thenCheckout) {
      flushCartPersist(useCartStore.getState().items);
      setAddedFlash(true);
      window.setTimeout(() => setAddedFlash(false), 1500);
      toast.success(t("added"), {
        action: {
          label: t("viewCart"),
          onClick: () => router.push("/cart"),
        },
      });
      setAdding(false);
      return;
    }

    // Buy Now: persist + wait for the write to be observable before navigating.
    flushAndNavigate(useCartStore.getState().items, () => {
      router.push("/checkout?from=cart");
      setAdding(false);
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <motion.button
          type="button"
          disabled={adding}
          onClick={(e) => handleAdd(false, e)}
          {...tapProps}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-[10px] border-2 py-3.5 text-sm font-semibold transition-all disabled:opacity-60",
            addedFlash
              ? "border-[#4CAF50] bg-[#4CAF50] text-white"
              : "border-warka-primary bg-card text-warka-primary hover:bg-warka-primary/10"
          )}
        >
          <AnimatePresence mode="wait">
            {addedFlash ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-2"
              >
                <Check className="size-4" />
                {locale === "ar" ? "✓ تمت الإضافة" : "✓ Added"}
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-2"
              >
                <ShoppingBag className="size-4" />
                {t("addToCart")}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <motion.button
          type="button"
          disabled={adding}
          onClick={(e) => handleAdd(true, e)}
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