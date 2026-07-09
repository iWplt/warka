import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  WARKA_BRAND_NAME,
  WARKA_LOGO_PATH,
  WARKA_LOGO_ON_DARK_PATH,
  WARKA_MARK_PATH,
  WARKA_MARK_ON_DARK_PATH,
} from "@/lib/constants/brand";

type BrandLockupProps = {
  /** light = cream header; dark = footer/sidebar */
  variant?: "light" | "dark";
  /** header = compact row; footer = slightly larger; auth = centered stack; mark = emblem only */
  layout?: "header" | "footer" | "auth" | "full" | "mark";
  tagline?: string;
  className?: string;
  priority?: boolean;
};

export function BrandLockup({
  variant = "light",
  layout = "header",
  tagline,
  className,
  priority,
}: BrandLockupProps) {
  const isDark = variant === "dark";
  const markSrc = isDark ? WARKA_MARK_ON_DARK_PATH : WARKA_MARK_PATH;
  const logoSrc = isDark ? WARKA_LOGO_ON_DARK_PATH : WARKA_LOGO_PATH;

  if (layout === "mark") {
    return (
      <Image
        src={markSrc}
        alt={WARKA_BRAND_NAME}
        width={48}
        height={48}
        className={cn("shrink-0 object-contain object-center", className)}
        priority={priority}
        unoptimized
      />
    );
  }

  if (layout === "full") {
    return (
      <Image
        src={logoSrc}
        alt={WARKA_BRAND_NAME}
        width={160}
        height={192}
        className={cn("h-auto w-auto max-h-[4.25rem] object-contain object-top sm:max-h-[4.75rem]", className)}
        priority={priority}
        unoptimized
      />
    );
  }

  if (layout === "auth") {
    return (
      <div className={cn("flex flex-col items-center gap-1.5", className)}>
        <Image
          src={logoSrc}
          alt={WARKA_BRAND_NAME}
          width={140}
          height={168}
          className="h-[4.75rem] w-auto max-w-[7rem] object-contain object-top sm:h-20 sm:max-w-[7.5rem]"
          priority={priority}
          unoptimized
        />
        {tagline && <p className="text-xs text-warka-text-muted">{tagline}</p>}
      </div>
    );
  }

  const markSize = layout === "footer" ? "h-10 w-10" : "h-9 w-9 sm:h-10 sm:w-10";
  const wordSize = layout === "footer" ? "text-xl" : "text-base sm:text-lg";

  return (
    <div className={cn("flex min-w-0 items-center gap-2 overflow-visible", className)}>
      <span className="inline-flex shrink-0 items-center justify-center overflow-visible">
        <Image
          src={markSrc}
          alt=""
          aria-hidden
          width={56}
          height={56}
          className={cn("object-contain object-center", markSize)}
          priority={priority}
          unoptimized
        />
      </span>
      <div className="min-w-0 leading-none">
        <span className={cn("font-display block font-bold tracking-[0.14em]", wordSize)}>
          {WARKA_BRAND_NAME}
        </span>
        {tagline && (
          <span
            className={cn(
              "mt-0.5 block truncate text-[10px]",
              isDark ? "opacity-60" : "text-warka-text-muted",
              layout === "header" ? "hidden sm:block max-w-[9rem]" : "max-w-[12rem]"
            )}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}
