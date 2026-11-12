import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/format/digits";

export const typographyVariants = cva("", {
  variants: {
    variant: {
      "display-lg": "text-3xl font-black leading-tight tracking-tight",
      "headline-md": "text-2xl font-extrabold leading-snug tracking-tight",
      "title-lg": "text-xl font-extrabold leading-snug",
      "title-md": "text-base font-bold leading-snug",
      "title-sm": "text-sm font-bold leading-snug",
      "body-lg": "text-body font-normal leading-7",
      "body-md": "text-sm font-normal leading-relaxed",
      "body-sm": "text-xs font-normal leading-relaxed",
      "label-lg": "text-sm font-semibold leading-none",
      "label-md": "text-xs font-semibold leading-tight",
      "label-sm": "text-2xs font-medium leading-tight",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      "on-primary": "text-on-primary",
      sun: "text-sun",
      gold: "text-gold",
      danger: "text-destructive",
      success: "text-success",
      inherit: "text-current",
    },
    numeric: {
      true: "tabular-nums",
      false: "",
    },
  },
  defaultVariants: {
    variant: "body-md",
    tone: "default",
    numeric: false,
  },
});

type TagName = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "label" | "strong" | "div";

const DEFAULT_TAG: Record<
  NonNullable<VariantProps<typeof typographyVariants>["variant"]>,
  TagName
> = {
  "display-lg": "h1",
  "headline-md": "h1",
  "title-lg": "h2",
  "title-md": "h2",
  "title-sm": "h3",
  "body-lg": "p",
  "body-md": "p",
  "body-sm": "p",
  "label-lg": "span",
  "label-md": "span",
  "label-sm": "span",
};

export interface TypographyProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: TagName;
  children?: ReactNode;
}

export function Typography({
  variant = "body-md",
  tone = "default",
  numeric = false,
  as,
  className,
  children,
  ...props
}: TypographyProps) {
  const Component = as ?? DEFAULT_TAG[variant ?? "body-md"];
  return (
    <Component
      className={cn(typographyVariants({ variant, tone, numeric }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}
