"use client";

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/format/digits";

export interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
  fading: boolean;
  createdAt: number;
}

export function useRipple(disabled = false) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const activeRippleIdRef = useRef<number | null>(null);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const release = useCallback(() => {
    const activeId = activeRippleIdRef.current;
    if (!activeId) return;
    activeRippleIdRef.current = null;

    if (releaseTimerRef.current) {
      clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }

    setRipples((prev) =>
      prev.map((r) => {
        if (r.id !== activeId || r.fading) return r;
        const elapsed = Date.now() - r.createdAt;
        // Material Design 3 minimum hold time for natural ripple expansion
        const MIN_HOLD = 225;
        const delay = Math.max(0, MIN_HOLD - elapsed);

        if (delay === 0) {
          setTimeout(() => {
            setRipples((latest) => latest.filter((item) => item.id !== r.id));
          }, 220);
          return { ...r, fading: true };
        } else {
          setTimeout(() => {
            setRipples((latest) =>
              latest.map((item) => (item.id === r.id ? { ...item, fading: true } : item))
            );
            setTimeout(() => {
              setRipples((latest) => latest.filter((item) => item.id !== r.id));
            }, 220);
          }, delay);
          return r;
        }
      })
    );
  }, []);

  const spawn = useCallback(
    (clientX: number | null, clientY: number | null, currentTarget: HTMLElement) => {
      if (disabled) return;
      const rect = currentTarget.getBoundingClientRect();
      const clickX = clientX !== null ? clientX - rect.left : rect.width / 2;
      const clickY = clientY !== null ? clientY - rect.top : rect.height / 2;

      // Material Design 3 furthest-corner distance formula
      const d1 = Math.hypot(clickX, clickY);
      const d2 = Math.hypot(rect.width - clickX, clickY);
      const d3 = Math.hypot(clickX, rect.height - clickY);
      const d4 = Math.hypot(rect.width - clickX, rect.height - clickY);
      const radius = Math.max(d1, d2, d3, d4, 16);
      const size = radius * 2;
      const x = clickX - radius;
      const y = clickY - radius;

      const id = Date.now() + Math.random();
      activeRippleIdRef.current = id;

      setRipples((prev) => [
        ...prev.slice(-2),
        { id, x, y, size, fading: false, createdAt: Date.now() },
      ]);

      // Fallback: auto-release if pointerUp/leave never fires (e.g. quick programmatic click)
      releaseTimerRef.current = setTimeout(() => {
        if (activeRippleIdRef.current === id) {
          release();
        }
      }, 600);
    },
    [disabled, release]
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (disabled || e.button > 0) return;
      spawn(e.clientX, e.clientY, e.currentTarget);
    },
    [disabled, spawn]
  );

  const onPointerUp = useCallback(() => release(), [release]);
  const onPointerLeave = useCallback(() => release(), [release]);
  const onPointerCancel = useCallback(() => release(), [release]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        if (activeRippleIdRef.current !== null) return;
        spawn(null, null, e.currentTarget);
      }
    },
    [disabled, spawn]
  );

  const onKeyUp = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        release();
      }
    },
    [disabled, release]
  );

  return {
    ripples,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onKeyDown,
    onKeyUp,
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
    },
  };
}

export function RippleLayer({
  ripples,
  className,
}: {
  ripples: RippleItem[];
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        className
      )}
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
          className={cn(
            "animate-ripple absolute rounded-full bg-current",
            r.fading ? "animate-ripple-exit" : "animate-ripple-enter"
          )}
        />
      ))}
    </span>
  );
}
