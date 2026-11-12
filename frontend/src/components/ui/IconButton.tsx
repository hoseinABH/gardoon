"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/format/digits";
import { RippleLayer, useRipple } from "./Ripple";

const iconButtonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        tonal: "bg-white/7 text-foreground hover:bg-white/13",
        ghost: "bg-transparent text-muted-foreground hover:bg-white/8 hover:text-foreground",
        filled: "bg-primary text-on-primary [&_svg]:text-on-primary shadow-glow hover:brightness-105",
      },
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "tonal",
      size: "md",
    },
  }
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  "aria-label": string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      children,
      variant = "tonal",
      size = "md",
      className,
      disabled,
      type = "button",
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref
  ) {
    const ripple = useRipple(Boolean(disabled));

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        {...props}
        onPointerDown={(e) => {
          ripple.onPointerDown(e);
          onPointerDown?.(e);
        }}
        onPointerUp={(e) => {
          ripple.onPointerUp();
          props.onPointerUp?.(e);
        }}
        onPointerLeave={(e) => {
          ripple.onPointerLeave();
          props.onPointerLeave?.(e);
        }}
        onPointerCancel={(e) => {
          ripple.onPointerCancel();
          props.onPointerCancel?.(e);
        }}
        onKeyDown={(e) => {
          ripple.onKeyDown(e);
          onKeyDown?.(e);
        }}
        onKeyUp={(e) => {
          ripple.onKeyUp(e);
          props.onKeyUp?.(e);
        }}
        className={cn(iconButtonVariants({ variant, size }), className)}
      >
        <RippleLayer ripples={ripple.ripples} />
        <span className="relative z-10 inline-flex items-center justify-center">
          {children}
        </span>
      </button>
    );
  }
);
