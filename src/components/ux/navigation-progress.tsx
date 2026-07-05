"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
        return;
      }

      if (rawHref.startsWith("http") && !rawHref.startsWith(window.location.origin)) return;

      const nextPath = rawHref.replace(window.location.origin, "") || "/";
      const stripLocale = (path: string) => path.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
      if (stripLocale(nextPath) === stripLocale(pathname)) return;

      setActive(true);
      setProgress(18);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  useEffect(() => {
    setActive(false);
    setProgress(0);
  }, [pathname]);

  useEffect(() => {
    if (!active) return;

    const step = window.setTimeout(() => setProgress(62), 120);
    const finish = window.setTimeout(() => setProgress(92), 420);

    return () => {
      window.clearTimeout(step);
      window.clearTimeout(finish);
    };
  }, [active]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-warka-primary/15 transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className="h-full bg-warka-primary transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
