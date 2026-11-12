"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  Icons,
  SelectField,
  Shell,
  Tabs,
  TextField,
  TopBar,
  Typography,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import type { CalculationMode, CycleInterval } from "@/lib/api/types";
import { useAuthStore, useHasMounted } from "@/features/auth/store";
import { useDemoStore } from "@/features/groups/demoStore";
import { onlyDigits, toFaDigits } from "@/lib/format/digits";
import { formatNumber, numberToWords } from "@/lib/format/money";
import { todayJalaliDay } from "@/lib/format/jalali";

export function CreateGroupWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mounted = useHasMounted();
  const { user, demoMode, hydrated } = useAuthStore();
  const demoCreateGroup = useDemoStore((s) => s.createGroup);

  const [title, setTitle] = useState("");
  const [calculationMode, setCalculationMode] =
    useState<CalculationMode>("TARGET_POT");
  const [rawAmount, setRawAmount] = useState("10000000");
  const [cycleInterval, setCycleInterval] = useState<CycleInterval>("MONTHLY");
  const [jalaliDueDay, setJalaliDueDay] = useState<number>(() => todayJalaliDay());
  const [gracePeriodHours, setGracePeriodHours] = useState<number>(48);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/auth?next=/create");
    }
  }, [hydrated, user, router]);

  if (!mounted || !hydrated || !user) return null;

  const numericAmount = Number(onlyDigits(rawAmount)) || 0;
  const formattedAmount = numericAmount > 0 ? formatNumber(numericAmount) : "";
  const amountWords = numericAmount > 0 ? numberToWords(numericAmount) : "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      toast.error("عنوان صندوق باید حداقل ۲ حرف باشد");
      return;
    }
    if (numericAmount < 10_000) {
      toast.error("مبلغ پایه نباید کمتر از ۱۰,۰۰۰ تومان باشد");
      return;
    }

    if (demoMode) {
      const created = demoCreateGroup({
        title: title.trim(),
        calculationMode,
        baseAmount: numericAmount,
        cycleInterval,
        jalaliDueDay,
      });
      toast.success("صندوق آزمایشی ایجاد شد");
      router.push(`/groups/${created.id}`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.groups.create({
        title: title.trim(),
        calculationMode,
        baseAmount: numericAmount,
        cycleInterval,
        jalaliDueDay,
        gracePeriodHours,
      });
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("صندوق جدید با موفقیت ساخته شد");
      router.push(`/groups/${created.id}`);
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "خطا در ایجاد صندوق";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <TopBar
        title="ساخت صندوق جدید"
        subtitle="تنظیم مبلغ و دوره قرعه‌کشی"
        backTo="/home"
      />

      <main className="flex-1 px-5 py-5 pb-28">
        <form onSubmit={handleSubmit} className="space-y-5">
          <TextField
            label="عنوان صندوق"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onClear={() => setTitle("")}
            hint="مثلاً: صندوق قرض‌الحسنه خانواده"
          />

          <div className="space-y-2.5">
            <Typography variant="label-md" tone="muted" className="block pe-1">
              نحوه محاسبه مبالغ صندوق
            </Typography>

            <Tabs<CalculationMode>
              ariaLabel="نحوه محاسبه صندوق"
              layoutGroupId="create-calc-mode"
              value={calculationMode}
              onChange={setCalculationMode}
              items={[
                {
                  id: "TARGET_POT",
                  label: "مبلغ کل وام ثابت",
                  icon: <Icons.Coins className="h-3.5 w-3.5" />,
                },
                {
                  id: "FIXED_CONTRIBUTION",
                  label: "قسط ماهانه ثابت",
                  icon: <Icons.Calendar className="h-3.5 w-3.5" />,
                },
              ]}
            />

            <Typography variant="body-sm" tone="muted" className="px-2">
              {calculationMode === "TARGET_POT"
                ? "مبلغ کل وام مشخص است و سهم هر عضو پس از تکمیل اعضا تقسیم می‌شود."
                : "مبلغ قسط هر عضو ثابت است و کل وام بر اساس تعداد اعضا جمع می‌شود."}
            </Typography>
          </div>

          <div className="space-y-2">
            <TextField
              label={
                calculationMode === "TARGET_POT"
                  ? "مبلغ هدف وام هر نوبت (تومان)"
                  : "مبلغ قسط هر عضو در هر دوره (تومان)"
              }
              inputMode="numeric"
              ltr
              value={formattedAmount}
              onChange={(e) => setRawAmount(onlyDigits(e.target.value))}
              onClear={() => setRawAmount("")}
              suffix="تومان"
            />
            {amountWords && (
              <div className="rounded-xl bg-primary/10 px-3 py-2">
                <Typography variant="label-md" tone="primary">
                  معادل {amountWords}
                </Typography>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Typography variant="label-md" tone="muted" className="block pe-1">
              دوره تکرار قرعه‌کشی
            </Typography>
            <Tabs<CycleInterval>
              ariaLabel="دوره تکرار"
              layoutGroupId="create-cycle-interval"
              value={cycleInterval}
              onChange={setCycleInterval}
              items={[
                {
                  id: "MONTHLY",
                  label: "ماهانه (شمسی)",
                  icon: <Icons.Calendar className="h-3.5 w-3.5" />,
                },
                {
                  id: "WEEKLY",
                  label: "هفتگی",
                  icon: <Icons.Calendar className="h-3.5 w-3.5" />,
                },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <SelectField
              label="روز سررسید (شمسی)"
              value={jalaliDueDay}
              onChange={(e) => setJalaliDueDay(Number(e.target.value))}
              options={Array.from({ length: 31 }, (_, i) => i + 1).map((d) => ({
                value: d,
                label: `روز ${toFaDigits(d)} هر ماه`,
              }))}
            />

            <SelectField
              label="مهلت واریز"
              value={gracePeriodHours}
              onChange={(e) => setGracePeriodHours(Number(e.target.value))}
              options={[
                { value: 24, label: "۲۴ ساعت" },
                { value: 48, label: "۴۸ ساعت" },
                { value: 72, label: "۷۲ ساعت" },
              ]}
            />
          </div>

          <Button type="submit" variant="sun" loading={submitting} block className="mt-2">
            ایجاد صندوق و دریافت کد دعوت
          </Button>
        </form>
      </main>
    </Shell>
  );
}
