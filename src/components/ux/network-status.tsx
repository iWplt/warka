"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function NetworkStatus() {
  const locale = useLocale();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const message =
    locale === "ar"
      ? "أنت غير متصل بالإنترنت"
      : "You are offline";

  return (
    <AnimatePresence>
      {offline ? (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -48 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 px-4 py-2.5 font-arabic text-sm font-medium text-white shadow-md",
            "bg-[#FF9800]"
          )}
        >
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          <span>{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
