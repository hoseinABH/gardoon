"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Button,
  GardoonLogo,
  Icons,
  Shell,
  Typography,
} from "@/components/ui";
import { useAuthStore, useHasMounted } from "@/features/auth/store";
import { hasSeenOnboarding, markOnboardingSeen } from "./storage";

const SLIDES = [
  {
    key: "cards",
    image: "/onboarding/onb-cards.png",
    tag: "صندوق قرض‌الحسنه",
    title: "هم‌افزایی سرمایه",
    body: "صندوق‌های قرض‌الحسنه خانوادگی و دوستانه خود را شفاف، منظم و بدون کاغذبازی مدیریت کنید.",
  },
  {
    key: "draw",
    image: "/onboarding/onb-draw.png",
    tag: "قرعه‌کشی سررسید",
    title: "انتخاب عادلانه برنده",
    body: "در تاریخ سررسید هر دوره، برنده نوبت به‌صورت تصادفی از میان اعضایی که هنوز وام نگرفته‌اند انتخاب می‌شود.",
  },
  {
    key: "shield",
    image: "/onboarding/onb-shield.png",
    tag: "تسویه مطمئن",
    title: "تضمین و ثبت رسید",
    body: "واریزی‌ها مستقیماً کارت‌به‌کارت انجام می‌شود و تصویر رسید با کد پیگیری توسط برنده تایید می‌گردد.",
  },
];

export function OnboardingScreen() {
  const router = useRouter();
  const mounted = useHasMounted();
  const { user, hydrated } = useAuthStore();
  const [step, setStep] = useState(0);
  const [alreadySeen, setAlreadySeen] = useState(false);

  useEffect(() => {
    if (hydrated && user) {
      router.replace("/home");
      return;
    }
    if (hasSeenOnboarding()) {
      setAlreadySeen(true);
      router.replace("/auth");
    }
  }, [hydrated, user, router]);

  if (mounted && ((hydrated && user) || alreadySeen)) {
    return null;
  }

  const current = SLIDES[step]!;
  const isLast = step === SLIDES.length - 1;

  const finishOnboarding = () => {
    markOnboardingSeen();
    router.push("/auth");
  };

  const handleNext = () => {
    if (isLast) {
      finishOnboarding();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <Shell className="flex min-h-dvh flex-col justify-between bg-canvas px-5 pt-6 pb-8">
      <div className="relative z-10 flex items-center justify-between">
        <GardoonLogo size={42} />

        {!isLast && (
          <Button
            variant="text"
            size="sm"
            onClick={finishOnboarding}
            className="text-muted-foreground hover:text-foreground"
          >
            رد شدن
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          className="relative z-10 flex flex-1 flex-col"
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 32 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative grid flex-1 place-items-center py-6">
            <div className="animate-pulse-glow pointer-events-none absolute inset-0 bg-glow-lime" />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative"
            >
              <Image
                src={current.image}
                alt={current.title}
                width={288}
                height={288}
                priority
                className="relative h-auto w-72 max-w-full drop-shadow-hero select-none"
              />
            </motion.div>
          </div>

          <div className="text-center space-y-3">
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
              <Typography variant="label-md" tone="primary">
                {current.tag}
              </Typography>
            </span>

            <Typography variant="display-lg" as="h1" className="block">
              {current.title}
            </Typography>

            <Typography
              variant="body-md"
              tone="muted"
              className="mx-auto max-w-xs leading-7"
            >
              {current.body}
            </Typography>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 space-y-6 pt-4">
        <div
          role="tablist"
          aria-label="اسلایدهای معرفی"
          className="flex items-center justify-center gap-1.5"
        >
          {SLIDES.map((s, idx) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={idx === step}
              aria-label={`اسلاید ${idx + 1}`}
              onClick={() => setStep(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === step
                  ? "w-6 bg-sun"
                  : "w-1.5 bg-secondary hover:bg-white/35"
              }`}
            />
          ))}
        </div>

        <Button
          variant={isLast ? "lime" : "sun"}
          block
          trailing={<Icons.ArrowLeft className="h-4 w-4" />}
          onClick={handleNext}
        >
          {isLast ? "شروع کنیم" : "بعدی"}
        </Button>
      </div>
    </Shell>
  );
}
