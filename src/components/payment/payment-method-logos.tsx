"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { IraqiPaymentMethodId } from "@/lib/payment/iraqi-methods";

const LOGO_SRC: Record<IraqiPaymentMethodId, string> = {
  zain_cash: "/assets/payment/zain-cash.png",
  super_qi: "/assets/payment/superqi.png",
  fib: "/assets/payment/fib.png",
  asiapay: "/assets/payment/asiapay.png",
  cash: "/assets/payment/cash.png",
};

/** Background so each brand logo reads clearly inside the same tile. */
const LOGO_TILE_BG: Record<IraqiPaymentMethodId, string> = {
  zain_cash: "#0a0a0a",
  super_qi: "#ffffff",
  fib: "#e8f6f4",
  asiapay: "#e30613",
  cash: "#ffffff",
};

/**
 * Uniform payment logo tile — same size, radius, and border for every method.
 */
export function PaymentMethodLogo({
  method,
  className,
  size = "md",
}: {
  method: IraqiPaymentMethodId;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-11" : size === "lg" ? "size-14" : "size-12";
  const pad =
    method === "zain_cash" || method === "asiapay"
      ? "p-0"
      : method === "super_qi"
        ? "p-2"
        : "p-1.5";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/5 shadow-sm",
        dim,
        className
      )}
      style={{ backgroundColor: LOGO_TILE_BG[method] }}
      aria-hidden
    >
      <span className={cn("relative block h-full w-full", pad)}>
        <Image
          src={LOGO_SRC[method]}
          alt=""
          fill
          className={cn(
            "object-contain",
            method === "asiapay" || method === "zain_cash" ? "object-cover" : "object-contain"
          )}
          sizes="56px"
          priority={false}
        />
      </span>
    </span>
  );
}
