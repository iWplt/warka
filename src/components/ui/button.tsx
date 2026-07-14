import { cva, type VariantProps } from "class-variance-authority";

import { Slot } from "@radix-ui/react-slot";

import * as React from "react";

import { cn } from "@/lib/utils";



const buttonVariants = cva(

  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold leading-snug transition-[transform,opacity,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",

  {

    variants: {

      variant: {

        default:

          "bg-primary text-primary-foreground shadow-card hover:bg-primary-dark active:scale-[0.99]",

        secondary:

          "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 active:scale-[0.98]",

        ghost: "hover:bg-muted/80 hover:text-foreground active:scale-[0.98]",

        outline:

          "border border-glass-border bg-glass/40 backdrop-blur-sm hover:bg-muted/60 active:scale-[0.98]",

        accent:

          "bg-primary text-primary-foreground shadow-card hover:bg-primary-dark active:scale-[0.99]",

        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",

        link: "text-primary underline-offset-4 hover:underline",

        glass:

          "glass-panel text-foreground hover:shadow-tint active:scale-[0.99]",

      },

      size: {
        default: "h-10 min-h-10 px-4 py-2",
        sm: "h-9 min-h-9 rounded-md px-3 text-xs whitespace-nowrap",
        lg: "h-11 min-h-11 rounded-lg px-6 text-[0.9375rem]",
        icon: "size-10 min-h-10 min-w-10",
      },

    },

    defaultVariants: {

      variant: "default",

      size: "default",

    },

  }

);



export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &

  VariantProps<typeof buttonVariants> & {

    asChild?: boolean;

  };



const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(

  ({ className, variant, size, asChild = false, ...props }, ref) => {

    const Comp = asChild ? Slot : "button";

    return (

      <Comp

        className={cn(buttonVariants({ variant, size, className }))}

        ref={ref}

        {...props}

      />

    );

  }

);

Button.displayName = "Button";



export { Button, buttonVariants };

