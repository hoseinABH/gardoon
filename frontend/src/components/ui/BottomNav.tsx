"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { useAuthStore, useHasMounted } from "@/features/auth/store";
import { cn } from "@/lib/format/digits";
import { Home, Plus, User } from "./Icons";
import { RippleLayer, useRipple } from "./Ripple";

const NAV_SPRING = {
  type: "spring" as const,
  stiffness: 280,
  damping: 26,
  mass: 0.9,
};

const NAV_ROUTES = ["/home", "/create", "/profile"];

function NavLinkItem({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  const ripple = useRipple(false);

  return (
    <li className="flex min-w-0 flex-1 justify-center">
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        onPointerDown={ripple.onPointerDown}
        onKeyDown={ripple.onKeyDown}
        className="flex w-full items-center justify-center py-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        <span
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-full px-5 py-1.5 transition-colors duration-200 select-none",
            active
              ? "text-primary [&_svg]:text-primary"
              : "text-muted-foreground hover:bg-white/4 hover:text-foreground"
          )}
        >
          {active && (
            <motion.span
              layoutId="gardoon-bottom-nav-pill"
              transition={NAV_SPRING}
              className="absolute inset-0 rounded-full border border-primary/25 bg-primary/15"
            />
          )}
          <RippleLayer ripples={ripple.ripples} />
          <motion.span
            animate={{ scale: active ? 1.06 : 1 }}
            transition={NAV_SPRING}
            className="relative z-10 flex items-center justify-center text-inherit"
          >
            {icon}
          </motion.span>
        </span>
      </Link>
    </li>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/home", label: "صندوق‌ها", icon: Home },
    { href: "/create", label: "صندوق جدید", icon: Plus },
    { href: "/profile", label: "پروفایل", icon: User },
  ];

  return (
    <LayoutGroup id="gardoon-bottom-nav">
      <nav
        aria-label="ناوبری اصلی"
        className="pointer-events-auto w-full border-t border-white/8 bg-card/95 backdrop-blur-xl pb-safe-dock shadow-dock"
      >
        <ul className="mx-auto flex items-center justify-around px-4">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <NavLinkItem
                key={item.href}
                href={item.href}
                label={item.label}
                active={active}
                icon={
                  <Icon
                    strokeWidth={active ? 2.4 : 1.9}
                    className="h-5 w-5"
                  />
                }
              />
            );
          })}
        </ul>
      </nav>
    </LayoutGroup>
  );
}

export function PersistentBottomNav() {
  const pathname = usePathname();
  const mounted = useHasMounted();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const visible = NAV_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!mounted || !hydrated || !user || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-shell">
      <BottomNav />
    </div>
  );
}
