import Image from "next/image";
import { cn } from "@/lib/utils";
import { WARKA_BRAND_NAME, WARKA_LOGO_PATH } from "@/lib/constants/brand";

const SIZE_CLASS = {
  xs: "h-8 w-auto max-w-[6rem]",
  sm: "h-10 w-auto max-w-[8rem]",
  md: "h-12 w-auto max-w-[10rem]",
  lg: "h-16 w-auto max-w-[13rem]",
  xl: "h-20 w-auto max-w-[16rem] sm:h-[5.5rem] sm:max-w-[18rem]",
} as const;

type WarkaLogoProps = {
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  priority?: boolean;
  /** Use image-only mark (default) or stacked text for footer contexts */
  variant?: "image" | "stacked";
  tagline?: string;
};

export function WarkaLogo({
  size = "md",
  className,
  priority,
  variant = "image",
  tagline,
}: WarkaLogoProps) {
  if (variant === "stacked" && tagline) {
    return (
      <div className={cn("flex flex-col items-start gap-1", className)}>
        <Image
          src={WARKA_LOGO_PATH}
          alt={WARKA_BRAND_NAME}
          width={320}
          height={128}
          className={cn("object-contain object-left", SIZE_CLASS[size])}
          priority={priority}
        />
        <p className="text-[11px] text-muted-foreground">{tagline}</p>
      </div>
    );
  }

  return (
    <Image
      src={WARKA_LOGO_PATH}
      alt={WARKA_BRAND_NAME}
      width={320}
      height={128}
      className={cn("object-contain object-left", SIZE_CLASS[size], className)}
      priority={priority}
    />
  );
}
