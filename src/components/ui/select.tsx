import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          // `select-chevron` (globals.css) paints a non-interactive chevron via
          // background-image, positioned at the inline-end in both RTL and LTR.
          // `pe-9` reserves room so the text never overlaps it.
          "flex h-10 min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-input bg-card ps-3 pe-9 py-2 text-sm text-foreground shadow-sm select-chevron",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
