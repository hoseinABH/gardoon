"use client";

import type { ReactNode } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { cn } from "@/lib/format/digits";
import { RippleLayer, useRipple } from "./Ripple";
import { Typography } from "./Typography";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: string;
}

const TAB_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

function TabButton<T extends string>({
  item,
  selected,
  variant,
  layoutGroupId,
  onSelect,
}: {
  item: TabItem<T>;
  selected: boolean;
  variant: "primary" | "pill" | "scrollable";
  layoutGroupId: string;
  onSelect: (id: T) => void;
}) {
  const ripple = useRipple(false);

  if (variant === "scrollable") {
    return (
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        onClick={() => onSelect(item.id)}
        onPointerDown={ripple.onPointerDown}
        onKeyDown={ripple.onKeyDown}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full border px-4 py-2 text-xs font-bold transition-colors duration-200 cursor-pointer",
          selected
            ? "border-primary text-on-primary [&_svg]:text-on-primary"
            : "border-white/10 bg-card text-muted-foreground hover:border-white/20 hover:text-foreground"
        )}
      >
        {selected && (
          <motion.span
            layoutId={`${layoutGroupId}-scrollable-pill`}
            transition={TAB_SPRING}
            className="absolute inset-0 rounded-full bg-primary shadow-sm"
          />
        )}
        <RippleLayer ripples={ripple.ripples} />
        <motion.span
          animate={{ scale: selected ? 1.02 : 1 }}
          transition={{ duration: 0.22 }}
          className="relative z-10 inline-flex items-center gap-1.5 text-inherit"
        >
          {item.icon}
          <span>{item.label}</span>
          {item.badge && (
            <span className="opacity-85 text-micro">{item.badge}</span>
          )}
        </motion.span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => onSelect(item.id)}
      onPointerDown={ripple.onPointerDown}
      onKeyDown={ripple.onKeyDown}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-full h-10 px-3 transition-colors duration-200 cursor-pointer",
        selected
          ? "text-on-primary [&_svg]:text-on-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {selected && (
        <motion.span
          layoutId={layoutGroupId}
          transition={TAB_SPRING}
          className="absolute inset-0 rounded-full bg-primary shadow-sm"
        />
      )}
      <RippleLayer ripples={ripple.ripples} />
      <motion.span
        animate={{ scale: selected ? 1.02 : 1 }}
        transition={{ duration: 0.22 }}
        className="relative z-10 inline-flex items-center gap-1.5 text-inherit"
      >
        {item.icon}
        <Typography
          variant="label-md"
          tone={selected ? "on-primary" : "inherit"}
          className={cn("transition-all duration-200", selected && "font-bold")}
        >
          {item.label}
        </Typography>
      </motion.span>
    </button>
  );
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = "pill",
  layoutGroupId = "gardoon-tabs-indicator",
  ariaLabel = "تب‌ها",
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "primary" | "pill" | "scrollable";
  layoutGroupId?: string;
  ariaLabel?: string;
  className?: string;
}) {
  if (variant === "scrollable") {
    return (
      <LayoutGroup id={`${layoutGroupId}-group`}>
        <div
          role="tablist"
          aria-label={ariaLabel}
          className={cn(
            "flex gap-2 overflow-x-auto pb-1 no-scrollbar",
            className
          )}
        >
          {items.map((item) => (
            <TabButton
              key={item.id}
              item={item}
              selected={item.id === value}
              variant="scrollable"
              layoutGroupId={layoutGroupId}
              onSelect={onChange}
            />
          ))}
        </div>
      </LayoutGroup>
    );
  }

  return (
    <LayoutGroup id={`${layoutGroupId}-group`}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          "flex items-center gap-1.5 rounded-full bg-card p-1 border border-white/6",
          className
        )}
      >
        {items.map((item) => (
          <TabButton
            key={item.id}
            item={item}
            selected={item.id === value}
            variant={variant}
            layoutGroupId={layoutGroupId}
            onSelect={onChange}
          />
        ))}
      </div>
    </LayoutGroup>
  );
}
