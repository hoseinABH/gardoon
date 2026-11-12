"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Avatar,
  Button,
  GardoonLogo,
  Icons,
  Sheet,
  Shell,
  StatusBadge,
  Tabs,
  TextField,
  Typography,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import { useAuthStore, useHasMounted } from "@/features/auth/store";
import { formatToman } from "@/lib/format/money";
import { cn, toEnDigits, toFaDigits } from "@/lib/format/digits";
import { toDemoSummary } from "@/features/groups/demoData";
import { useDemoStore } from "@/features/groups/demoStore";

type GroupFilter = "ALL" | "ACTIVE" | "RECRUITING";

export function HomeDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mounted = useHasMounted();
  const { user, demoMode, hydrated } = useAuthStore();
  const demoGroups = useDemoStore((s) => s.groups);

  const [filter, setFilter] = useState<GroupFilter>("ALL");
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/auth");
    }
  }, [hydrated, user, router]);

  const { data: liveGroups, isLoading } = useQuery({
    queryKey: ["groups", user?.id],
    queryFn: api.groups.list,
    enabled: hydrated && Boolean(user) && !demoMode,
  });

  if (!mounted || !hydrated || !user) {
    return null;
  }

  const groups = demoMode ? demoGroups.map(toDemoSummary) : liveGroups ?? [];
  const activeCount = groups.filter((g) => g.status === "ACTIVE").length;
  const recruitingCount = groups.filter((g) => g.status === "RECRUITING").length;
  const totalMonthlyVolume = groups.reduce(
    (sum, g) => sum + g.estimatedPotAmount,
    0
  );
  const totalCycleContribution = groups.reduce(
    (sum, g) => sum + g.estimatedPerMemberShare,
    0
  );
  const completedRoundsTotal = groups.reduce(
    (sum, g) => sum + g.completedRounds,
    0
  );
  const totalRoundsCount = groups.reduce(
    (sum, g) => sum + (g.totalRounds || g.memberCount),
    0
  );

  const filteredGroups = groups.filter((g) => {
    if (filter === "ACTIVE") return g.status === "ACTIVE";
    if (filter === "RECRUITING") return g.status === "RECRUITING";
    return true;
  });

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = toEnDigits(inviteCode).trim().toUpperCase();
    if (!cleaned) {
      toast.error("کد دعوت را وارد کنید");
      return;
    }
    if (demoMode) {
      toast.info("در حالت آزمایشی می‌توانید از صندوق نمونه استفاده کنید");
      setJoinOpen(false);
      return;
    }
    setJoining(true);
    try {
      const joined = await api.groups.join(cleaned);
      toast.success(`به صندوق «${joined.title}» پیوستید`);
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      setJoinOpen(false);
      setInviteCode("");
      router.push(`/groups/${joined.id}`);
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "کد دعوت نامعتبر است";
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Shell>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-glow-green opacity-80" />

      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Avatar name={user.fullName} hue={user.avatarHue} size="md" ring />
          </Link>
          <div>
            <Typography variant="label-sm" tone="muted" className="block">
              {demoMode ? "حالت پیش‌نمایش آزمایشی" : "خوش آمدید"}
            </Typography>
            <Typography variant="title-md" as="h1">
              {user.fullName}
            </Typography>
          </div>
        </div>

        <Button
          variant="tonal"
          size="sm"
          leading={<Icons.KeyRound className="h-3.5 w-3.5 text-primary" />}
          onClick={() => setJoinOpen(true)}
        >
          عضویت با کد
        </Button>
      </div>

      <main className="relative z-10 flex-1 space-y-5 px-5 pb-28 pt-2">
        <section className="rounded-hero bg-hero border border-white/10 p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GardoonLogo size={28} />
              <Typography variant="label-md" tone="primary">
                تراز و دفترکل صندوق‌ها
              </Typography>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 border border-primary/25 px-2.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <Typography variant="label-sm" tone="primary" numeric>
                {toFaDigits(activeCount)} صندوق فعال
              </Typography>
            </span>
          </div>

          <div className="space-y-1">
            <Typography variant="label-sm" tone="muted" className="block">
              مجموع گردش دوره‌ای صندوق‌های شما
            </Typography>
            <Typography variant="headline-md" as="p" numeric>
              {formatToman(totalMonthlyVolume)}
            </Typography>
          </div>

          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-white/8 rounded-2xl border border-white/8 bg-black/25 py-2.5">
            <div className="px-3.5 space-y-0.5">
              <Typography variant="label-sm" tone="muted" className="block">
                مجموع قسط هر دور
              </Typography>
              <Typography variant="title-sm" tone="primary" numeric>
                {formatToman(totalCycleContribution)}
              </Typography>
            </div>
            <div className="px-3.5 space-y-0.5">
              <Typography variant="label-sm" tone="muted" className="block">
                وضعیت دورهای تسویه
              </Typography>
              <Typography variant="title-sm" tone="sun" numeric>
                {toFaDigits(completedRoundsTotal)} از {toFaDigits(totalRoundsCount)} دور
              </Typography>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              size="md"
              variant="sun"
              onClick={() => router.push("/create")}
              leading={<Icons.Plus className="h-4 w-4" />}
            >
              ساخت صندوق
            </Button>
            <Button
              size="md"
              variant="tonal"
              onClick={() => setJoinOpen(true)}
              leading={<Icons.KeyRound className="h-4 w-4" />}
            >
              ورود با کد دعوت
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Typography variant="title-sm" as="h2">
              صندوق‌های من
            </Typography>
            <Typography variant="label-sm" tone="muted" numeric>
              {toFaDigits(filteredGroups.length)} از {toFaDigits(groups.length)} مورد
            </Typography>
          </div>

          {groups.length > 0 && (
            <Tabs<GroupFilter>
              ariaLabel="فیلتر وضعیت صندوق‌ها"
              layoutGroupId="home-group-filter"
              value={filter}
              onChange={setFilter}
              items={[
                { id: "ALL", label: `همه (${toFaDigits(groups.length)})` },
                { id: "ACTIVE", label: `فعال (${toFaDigits(activeCount)})` },
                {
                  id: "RECRUITING",
                  label: `عضوگیری (${toFaDigits(recruitingCount)})`,
                },
              ]}
            />
          )}

          {isLoading && !demoMode ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-28 animate-pulse rounded-3xl bg-card/70 border border-white/5"
                />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/12 bg-card/40 p-7 text-center space-y-3">
              <Typography variant="title-sm" as="p">
                هنوز عضو هیچ صندوقی نیستید
              </Typography>
              <Typography variant="body-sm" tone="muted">
                می‌توانید یک صندوق خانوادگی یا دوستانه بسازید و کد دعوت را برای
                اعضا بفرستید.
              </Typography>
              <Button
                size="md"
                variant="sun"
                onClick={() => router.push("/create")}
              >
                ایجاد اولین صندوق
              </Button>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-3xl border border-white/8 bg-card/60 p-6 text-center space-y-2">
              <Typography variant="body-sm" tone="muted">
                صندوقی با این وضعیت یافت نشد.
              </Typography>
            </div>
          ) : (
            <div className="overflow-hidden rounded-card border border-white/8 bg-card divide-y divide-white/6 shadow-card">
              {filteredGroups.map((g) => {
                const total = g.totalRounds || g.memberCount;
                const progress =
                  total > 0 ? Math.round((g.completedRounds / total) * 100) : 0;
                const isRecruiting = g.status === "RECRUITING";
                const isCompleted = g.status === "COMPLETED";

                return (
                  <Link
                    key={g.id}
                    href={`/groups/${g.id}`}
                    className="block p-4 transition-colors hover:bg-white/3 active:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                            isRecruiting
                              ? "border-sun/30 bg-sun/12 text-sun"
                              : isCompleted
                              ? "border-success/30 bg-success/12 text-success"
                              : "border-primary/30 bg-primary/12 text-primary"
                          )}
                        >
                          {isCompleted ? (
                            <Icons.CheckCircle2 className="h-5 w-5" />
                          ) : isRecruiting ? (
                            <Icons.Users className="h-5 w-5" />
                          ) : (
                            <Icons.Coins className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <Typography
                            variant="title-sm"
                            as="h3"
                            className="truncate text-body"
                          >
                            {g.title}
                          </Typography>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={g.status} />
                            <Typography
                              variant="label-sm"
                              tone="muted"
                              numeric
                              className="truncate"
                            >
                              {toFaDigits(g.memberCount)} عضو •{" "}
                              {g.cycleInterval === "WEEKLY" ? "هفتگی" : "ماهانه"}
                            </Typography>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-end space-y-0.5">
                        <Typography
                          variant="title-sm"
                          tone="primary"
                          numeric
                          className="block font-extrabold"
                        >
                          {formatToman(g.estimatedPotAmount)}
                        </Typography>
                        <Typography
                          variant="label-sm"
                          tone="muted"
                          numeric
                          className="block"
                        >
                          قسط: {formatToman(g.estimatedPerMemberShare)}
                        </Typography>
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Typography variant="label-sm" tone="muted" numeric>
                          پیشرفت دورها: {toFaDigits(g.completedRounds)} از{" "}
                          {toFaDigits(total)}
                        </Typography>
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Typography
                            variant="label-sm"
                            tone="primary"
                            className="font-bold"
                          >
                            مشاهده دفترکل
                          </Typography>
                          <Icons.ArrowLeft className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/7">
                        <div
                          style={{ width: `${Math.max(progress, 6)}%` }}
                          className="h-full rounded-full bg-primary transition-all"
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Sheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="عضویت در صندوق با کد دعوت"
      >
        <form onSubmit={handleJoin} className="space-y-5">
          <TextField
            label="کد دعوت صندوق"
            ltr
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            onClear={() => setInviteCode("")}
            hint="کد ۶ تا ۱۰ کاراکتری دریافت‌شده از مدیر صندوق را وارد کنید."
          />
          <Button type="submit" variant="sun" loading={joining} block>
            بررسی و عضویت
          </Button>
        </form>
      </Sheet>
    </Shell>
  );
}
