"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

type CartBadgeProps = {
  className?: string;
};

export function CartBadge({ className }: CartBadgeProps) {
  const itemCount = useCartStore((s) => s.itemCount);
  const [mounted, setMounted] = useState(false);
  const count = mounted ? itemCount() : 0;

  useEffect(() => setMounted(true), []);

  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "absolute -top-0.5 -end-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warka-primary px-1 text-[10px] font-bold text-white shadow-sm",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
