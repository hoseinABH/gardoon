"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/format/digits";
import { Loader } from "./Loader";
import { RippleLayer, useRipple } from "./Ripple";

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-bold transition-all active:scale-98 disabled:opacity-45 disabled:pointer-events-none select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        lime: "bg-primary text-on-primary [&_svg]:text-on-primary shadow-glow hover:brightness-105",
        filled:
          "bg-primary text-on-primary [&_svg]:text-on-primary shadow-glow hover:brightness-105",
        sun: "bg-sun text-on-sun [&_svg]:text-on-sun shadow-card hover:brightness-105",
        royal: "bg-royal-grad text-white shadow-card hover:brightness-110",
        gold: "bg-gold-grad text-on-gold [&_svg]:text-on-gold shadow-card hover:brightness-105",
        glass:
          "bg-white/7 text-foreground border border-white/10 hover:bg-white/11",
        tonal:
          "bg-white/7 text-foreground border border-white/10 hover:bg-white/11",
        outlined:
          "border border-primary/50 bg-transparent text-primary hover:bg-primary/10",
        ghost: "bg-transparent text-foreground hover:bg-white/6",
        text: "bg-transparent text-primary hover:bg-primary/10",
        danger:
          "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25",
        error:
          "bg-destructive text-destructive-foreground shadow-card hover:brightness-105",
      },
      size: {
        lg: "h-11 px-5 text-sm",
        md: "h-10 px-4 text-xs",
        sm: "h-8 px-3 text-xs",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "lime",
      size: "lg",
      block: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "lime",
    size = "lg",
    block = false,
    className,
    leading,
    trailing,
    loading = false,
    loadingLabel = "در حال پردازش...",
    disabled,
    type = "button",
    onPointerDown,
    onKeyDown,
    ...props
  },
  ref
) {
  const isDisabled = Boolean(disabled || loading);
  const ripple = useRipple(isDisabled);

  return (
    <button
      ref={ref}
      type={type}
      {...props}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onPointerDown={(e) => {
        ripple.onPointerDown(e);
        onPointerDown?.(e);
      }}
      onKeyDown={(e) => {
        ripple.onKeyDown(e);
        onKeyDown?.(e);
      }}
      className={cn(buttonVariants({ variant, size, block }), className)}
    >
      <RippleLayer ripples={ripple.ripples} />
      {loading ? (
        <Loader size={size === "sm" ? "xs" : "sm"} />
      ) : (
        leading && <span className="relative z-10 shrink-0 text-inherit">{leading}</span>
      )}
      <span className="relative z-10 text-inherit">
        {loading ? loadingLabel : children}
      </span>
      {trailing && !loading && (
        <span className="relative z-10 shrink-0 text-inherit transition-transform group-hover:-translate-x-0.5">
          {trailing}
        </span>
      )}
    </button>
  );
});
