"use client";

import { useCallback, useState, type KeyboardEvent, type PointerEvent } from "react";

interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function useRipple(disabled = false) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);

  const spawn = useCallback(
    (x: number, y: number, size: number) => {
      if (disabled) return;
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev.slice(-3), { id, x, y, size }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((item) => item.id !== id));
      }, 900);
    },
    [disabled]
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (disabled || e.button > 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.15;
      const x = e.clientX ? e.clientX - rect.left - size / 2 : rect.width / 2 - size / 2;
      const y = e.clientY ? e.clientY - rect.top - size / 2 : rect.height / 2 - size / 2;
      spawn(x, y, size);
    },
    [disabled, spawn]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        const rect = e.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.15;
        spawn(rect.width / 2 - size / 2, rect.height / 2 - size / 2, size);
      }
    },
    [disabled, spawn]
  );

  return { ripples, onPointerDown, onKeyDown };
}

export function RippleLayer({ ripples }: { ripples: RippleItem[] }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
          className="animate-ripple absolute rounded-full bg-current"
        />
      ))}
    </span>
  );
}
