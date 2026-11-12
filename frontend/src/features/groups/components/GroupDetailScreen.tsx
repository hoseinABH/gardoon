"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Avatar,
  BankCard,
  Button,
  CopyButton,
  Icons,
  Sheet,
  Shell,
  StatusBadge,
  Tabs,
  TextField,
  TopBar,
  Typography,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import type { ChatMessage, GroupMember, Obligation } from "@/lib/api/types";
import { subscribeGroupTopics } from "@/lib/ws/stomp";
import { useAuthStore, useHasMounted } from "@/features/auth/store";
import { useDemoStore } from "@/features/groups/demoStore";
import { onlyDigits, toFaDigits } from "@/lib/format/digits";
import { formatToman } from "@/lib/format/money";
import { phoneValid } from "@/lib/validation/banking";
import {
  ReviewObligationSheet,
  UploadReceiptSheet,
} from "@/features/obligations/components/ObligationSheets";
import { GroupChatSheet } from "@/features/chat/components/GroupChatSheet";

export function GroupDetailScreen({ groupId }: { groupId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mounted = useHasMounted();
  const { user, demoMode, hydrated } = useAuthStore();

  const demoStore = useDemoStore();
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [tab, setTab] = useState<"ROUND" | "MEMBERS">("ROUND");
  const [chatOpen, setChatOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<Obligation | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Obligation | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<GroupMember | null>(null);
  const [replacementPhone, setReplacementPhone] = useState("");
  const [busyAction, setBusyAction] = useState(false);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(`/auth?next=${encodeURIComponent(`/groups/${groupId}`)}`);
    }
  }, [hydrated, user, router, groupId]);

  const { data: liveGroup, isLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => api.groups.get(groupId),
    enabled: hydrated && Boolean(user) && !demoMode,
  });

  const group = demoMode
    ? demoStore.groups.find((g) => g.id === groupId)
    : liveGroup;

  const activeRound = useMemo(() => {
    if (!group || group.rounds.length === 0) return null;
    if (selectedRoundId) {
      const explicit = group.rounds.find((r) => r.id === selectedRoundId);
      if (explicit) return explicit;
    }
    return (
      group.rounds.find((r) => r.status === "COLLECTING") ??
      group.rounds.find((r) => r.status === "PENDING_DRAW") ??
      group.rounds[group.rounds.length - 1]
    );
  }, [group, selectedRoundId]);

  const { data: liveObligations } = useQuery({
    queryKey: ["obligations", activeRound?.id],
    queryFn: () => api.obligations.listForRound(activeRound!.id),
    enabled:
      Boolean(user) &&
      !demoMode &&
      Boolean(activeRound?.id) &&
      activeRound?.status !== "PENDING_DRAW",
  });

  const { data: liveChat } = useQuery({
    queryKey: ["chat", groupId],
    queryFn: () => api.chat.list(groupId),
    enabled: Boolean(user) && !demoMode,
  });

  useEffect(() => {
    if (!user || demoMode) return;
    const sub = subscribeGroupTopics(groupId, {
      onChat: (msg) => {
        const chatMsg = msg as ChatMessage;
        queryClient.setQueryData<ChatMessage[]>(["chat", groupId], (old = []) =>
          old.some((m) => m.id === chatMsg.id) ? old : [...old, chatMsg]
        );
      },
      onWheel: () => {
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
        if (activeRound?.id) {
          queryClient.invalidateQueries({
            queryKey: ["obligations", activeRound.id],
          });
        }
      },
      onObligation: () => {
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
        if (activeRound?.id) {
          queryClient.invalidateQueries({
            queryKey: ["obligations", activeRound.id],
          });
        }
      },
    });
    return () => sub.disconnect();
  }, [user, demoMode, groupId, activeRound?.id, queryClient]);

  if (!mounted || !hydrated || !user) return null;

  if (!demoMode && isLoading) {
    return (
      <Shell>
        <TopBar title="در حال بارگذاری صندوق..." backTo="/home" />
        <div className="p-5 space-y-4">
          <div className="h-44 animate-pulse rounded-3xl bg-card" />
          <div className="h-36 animate-pulse rounded-3xl bg-card" />
        </div>
      </Shell>
    );
  }

  if (!group) {
    return (
      <Shell>
        <TopBar title="صندوق یافت نشد" backTo="/home" />
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center space-y-4">
          <Typography variant="body-md" tone="muted">
            دسترسی به این صندوق وجود ندارد یا حذف شده است.
          </Typography>
          <Button size="md" onClick={() => router.push("/home")}>
            بازگشت به صندوق‌ها
          </Button>
        </div>
      </Shell>
    );
  }

  const isOwner = group.ownerId === user.id;
  const obligations = demoMode
    ? activeRound
      ? demoStore.obligationsByRound[activeRound.id] ?? []
      : []
    : liveObligations ?? [];
  const messages = demoMode
    ? demoStore.chatByGroup[group.id] ?? []
    : liveChat ?? [];

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${group.inviteCode}`
      : `/join/${group.inviteCode}`;

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    await queryClient.invalidateQueries({ queryKey: ["groups"] });
    await queryClient.invalidateQueries({ queryKey: ["chat", groupId] });
    if (activeRound?.id) {
      await queryClient.invalidateQueries({
        queryKey: ["obligations", activeRound.id],
      });
    }
  };

  const handleLaunch = async () => {
    if (demoMode) {
      demoStore.launchGroup(group.id);
      toast.success("صندوق با موفقیت آغاز شد");
      return;
    }
    setBusyAction(true);
    try {
      await api.groups.launch(group.id);
      toast.success("صندوق به‌صورت رسمی آغاز شد و جدول دورها ایجاد گردید");
      await refreshAll();
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "امکان شروع صندوق نیست";
      toast.error(msg);
    } finally {
      setBusyAction(false);
    }
  };

  const handleDraw = async () => {
    if (!activeRound) return;
    if (demoMode) {
      demoStore.drawRound(group.id, activeRound.id);
      toast.success("قرعه‌کشی دور با موفقیت انجام شد");
      return;
    }
    setBusyAction(true);
    try {
      const result = await api.rounds.draw(activeRound.id);
      toast.success(
        `برنده دور ${toFaDigits(result.roundNumber)}: ${result.winnerName}`
      );
      await refreshAll();
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "خطا در اجرای قرعه‌کشی";
      toast.error(msg);
    } finally {
      setBusyAction(false);
    }
  };

  const handleReplaceMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!replaceTarget) return;
    const cleanPhone = onlyDigits(replacementPhone);
    if (!phoneValid(cleanPhone)) {
      toast.error("شماره موبایل معتبر نیست");
      return;
    }
    if (demoMode) {
      toast.info("جایگزینی عضو در نسخه متصل به سرور فعال است");
      setReplaceTarget(null);
      return;
    }
    setBusyAction(true);
    try {
      await api.groups.replaceMember(group.id, replaceTarget.userId, cleanPhone);
      toast.success("عضو جایگزین با موفقیت ثبت شد");
      setReplaceTarget(null);
      setReplacementPhone("");
      await refreshAll();
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "خطا در جایگزینی عضو";
      toast.error(msg);
    } finally {
      setBusyAction(false);
    }
  };

  const eligibleCandidatesCount = group.members.filter(
    (m) => !m.hasWonPot
  ).length;

  return (
    <Shell>
      <TopBar
        title={group.title}
        subtitle={`${toFaDigits(group.members.length)} عضو • ${
          group.cycleInterval === "WEEKLY" ? "هفتگی" : "ماهانه"
        }`}
        backTo="/home"
        right={
          <Button
            size="sm"
            variant="tonal"
            leading={<Icons.MessageCircle className="h-3.5 w-3.5 text-primary" />}
            onClick={() => setChatOpen(true)}
          >
            گفتگو {messages.length > 0 ? `(${toFaDigits(messages.length)})` : ""}
          </Button>
        }
      />

      <main className="flex-1 space-y-5 px-5 py-4 pb-10">
        <section className="rounded-card bg-hero border border-white/10 p-4 shadow-card space-y-3.5">
          <div className="flex items-center justify-between">
            <StatusBadge status={group.status} />
            <Typography variant="label-sm" tone="muted" numeric>
              سررسید هر {group.cycleInterval === "WEEKLY" ? "هفته" : "ماه"}: روز{" "}
              {toFaDigits(group.jalaliDueDay)}
            </Typography>
          </div>

          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/8 rounded-2xl border border-white/8 bg-black/20 py-2.5">
            <div className="px-2.5 space-y-0.5">
              <Typography variant="label-sm" tone="muted" className="block text-micro">
                مبلغ کل وام
              </Typography>
              <Typography variant="title-sm" tone="primary" numeric className="font-extrabold">
                {formatToman(group.totalPotAmount)}
              </Typography>
            </div>
            <div className="px-2.5 space-y-0.5">
              <Typography variant="label-sm" tone="muted" className="block text-micro">
                قسط هر عضو
              </Typography>
              <Typography variant="title-sm" numeric>
                {formatToman(group.perMemberShare)}
              </Typography>
            </div>
            <div className="px-2.5 space-y-0.5 text-end">
              <Typography variant="label-sm" tone="muted" className="block text-micro">
                دور فعلی
              </Typography>
              <Typography variant="title-sm" tone="sun" numeric>
                {activeRound
                  ? `${toFaDigits(activeRound.roundNumber)} از ${toFaDigits(group.rounds.length)}`
                  : `${toFaDigits(group.members.length)} عضو`}
              </Typography>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-2xl bg-black/25 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Icons.Share2 className="h-3.5 w-3.5 text-primary" />
              <Typography variant="label-sm" tone="muted">
                کد دعوت:
              </Typography>
              <Typography variant="label-md" className="font-mono">
                {group.inviteCode}
              </Typography>
            </div>
            <CopyButton value={shareUrl} label="کپی لینک دعوت" />
          </div>
        </section>

        <Tabs<"ROUND" | "MEMBERS">
          ariaLabel="بخش‌های صندوق"
          layoutGroupId="group-main-tabs"
          value={tab}
          onChange={setTab}
          items={[
            {
              id: "ROUND",
              label:
                group.status === "RECRUITING"
                  ? "وضعیت عضوگیری"
                  : "دورها و اقساط",
            },
            {
              id: "MEMBERS",
              label: `اعضا (${toFaDigits(group.members.length)})`,
            },
          ]}
        />

        {tab === "ROUND" && group.status === "RECRUITING" && (
          <section className="rounded-3xl border border-sun/25 bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sun/15 text-sun">
                <Icons.Users className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <Typography variant="title-sm">
                  منتظر تکمیل اعضای صندوق
                </Typography>
                <Typography variant="body-sm" tone="muted">
                  لینک دعوت را برای اعضا بفرستید و پس از پیوستن حداقل ۲ عضو،
                  صندوق را آغاز کنید.
                </Typography>
              </div>
            </div>

            {isOwner ? (
              <Button
                variant="sun"
                block
                loading={busyAction}
                disabled={group.members.length < 2}
                leading={<Icons.Play className="h-4 w-4" />}
                onClick={handleLaunch}
              >
                {group.members.length < 2
                  ? "حداقل ۲ عضو برای شروع لازم است"
                  : `شروع رسمی صندوق با ${toFaDigits(group.members.length)} عضو`}
              </Button>
            ) : (
              <div className="rounded-2xl bg-white/4 p-3 text-center">
                <Typography variant="body-sm" tone="muted">
                  منتظر تایید شروع توسط مدیر صندوق ({group.ownerName}) بمانید.
                </Typography>
              </div>
            )}
          </section>
        )}

        {tab === "ROUND" && group.status !== "RECRUITING" && (
          <section className="space-y-4">
            <Tabs<string>
              variant="scrollable"
              ariaLabel="انتخاب دور صندوق"
              value={activeRound?.id ?? ""}
              onChange={setSelectedRoundId}
              items={group.rounds.map((r) => ({
                id: r.id,
                label: `دور ${toFaDigits(r.roundNumber)}${
                  r.status === "SETTLED" ? " ✓" : ""
                }`,
              }))}
            />

            {activeRound && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/8 bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icons.Calendar className="h-4 w-4 text-primary" />
                      <Typography variant="label-sm" tone="muted">
                        سررسید دور {toFaDigits(activeRound.roundNumber)}:{" "}
                        <strong className="text-foreground">
                          {activeRound.jalaliDueDateLabel}
                        </strong>
                      </Typography>
                    </div>
                    <StatusBadge status={activeRound.status} />
                  </div>

                  {activeRound.status === "PENDING_DRAW" && (
                    <div className="rounded-2xl bg-royal/12 border border-royal/30 p-4 space-y-3 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-royal-grad text-white shadow">
                        <Icons.Dices className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <Typography variant="title-sm">
                          آماده انتخاب تصادفی برنده نوبت{" "}
                          {toFaDigits(activeRound.roundNumber)}
                        </Typography>
                        <Typography variant="body-sm" tone="muted">
                          برنده به‌صورت تصادفی از میان{" "}
                          <strong className="text-foreground">
                            {toFaDigits(eligibleCandidatesCount)} عضو
                          </strong>{" "}
                          که تاکنون وام دریافت نکرده‌اند انتخاب می‌شود.
                        </Typography>
                      </div>

                      {isOwner ? (
                        <Button
                          variant="royal"
                          block
                          loading={busyAction}
                          leading={<Icons.Dices className="h-4 w-4" />}
                          onClick={handleDraw}
                        >
                          اجرای قرعه‌کشی سررسید
                        </Button>
                      ) : (
                        <Typography variant="label-sm" tone="muted">
                          فقط مدیر صندوق در سررسید می‌تواند قرعه‌کشی را ثبت کند.
                        </Typography>
                      )}
                    </div>
                  )}

                  {activeRound.status !== "PENDING_DRAW" &&
                    activeRound.beneficiaryName && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-2xl bg-primary/10 border border-primary/25 px-3.5 py-2.5">
                          <Typography variant="label-sm" tone="muted">
                            برنده خوش‌شانس این دور:
                          </Typography>
                          <Typography variant="title-sm" tone="primary">
                            {activeRound.beneficiaryName}
                          </Typography>
                        </div>

                        <BankCard
                          holder={
                            activeRound.payoutHolderSnapshot ??
                            activeRound.beneficiaryName
                          }
                          card={activeRound.payoutCardSnapshot}
                          iban={activeRound.payoutIbanSnapshot}
                          bank={activeRound.payoutBankSnapshot}
                        />
                      </div>
                    )}
                </div>

                {activeRound.status !== "PENDING_DRAW" && (
                  <div className="space-y-3">
                    {(() => {
                      const confirmedCount = obligations.filter(
                        (o) => o.status === "CONFIRMED"
                      ).length;
                      const pct =
                        obligations.length > 0
                          ? Math.round((confirmedCount / obligations.length) * 100)
                          : 0;
                      return (
                        <div className="space-y-2 px-1">
                          <div className="flex items-center justify-between">
                            <Typography variant="title-sm" as="h3">
                              دفترکل واریز اقساط
                            </Typography>
                            <Typography variant="label-sm" tone="muted" numeric>
                              {toFaDigits(confirmedCount)} از{" "}
                              {toFaDigits(obligations.length)} تایید شده
                            </Typography>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/7">
                            <div
                              style={{ width: `${Math.max(pct, 4)}%` }}
                              className="h-full rounded-full bg-primary transition-all"
                            />
                          </div>
                        </div>
                      );
                    })()}

                    <div className="overflow-hidden rounded-card border border-white/8 bg-card divide-y divide-white/6 shadow-card">
                      {obligations.map((ob) => {
                        const isPayer = ob.payerUserId === user.id;
                        const isBeneficiary = ob.beneficiaryUserId === user.id;
                        const canUpload =
                          isPayer &&
                          (ob.status === "PENDING" || ob.status === "REJECTED");
                        const canReview =
                          (isBeneficiary || isOwner) &&
                          ob.status === "RECEIPT_SUBMITTED";

                        return (
                          <div key={ob.id} className="p-4 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar
                                  name={ob.payerName}
                                  hue={ob.payerAvatarHue}
                                  size="sm"
                                  badge={
                                    ob.status === "CONFIRMED"
                                      ? "check"
                                      : undefined
                                  }
                                />
                                <div className="min-w-0 space-y-0.5">
                                  <Typography
                                    variant="label-md"
                                    className="truncate block"
                                  >
                                    {ob.payerName}
                                    {isPayer ? " (شما)" : ""}
                                  </Typography>
                                  <Typography
                                    variant="label-sm"
                                    tone="muted"
                                    className="truncate block"
                                  >
                                    واریز به{" "}
                                    {activeRound.beneficiaryName ?? "برنده دور"}
                                  </Typography>
                                </div>
                              </div>

                              <div className="shrink-0 text-end space-y-1">
                                <Typography
                                  variant="label-md"
                                  tone={
                                    ob.status === "CONFIRMED"
                                      ? "success"
                                      : ob.status === "REJECTED"
                                      ? "danger"
                                      : "primary"
                                  }
                                  numeric
                                  className="block font-extrabold"
                                >
                                  {formatToman(ob.amount)}
                                </Typography>
                                <StatusBadge status={ob.status} />
                              </div>
                            </div>

                            {ob.rejectionReason && (
                              <div className="rounded-xl bg-destructive/10 px-3 py-1.5">
                                <Typography variant="label-sm" tone="danger">
                                  دلیل رد: {ob.rejectionReason}
                                </Typography>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                              <Typography variant="label-sm" tone="muted" numeric>
                                {ob.trackingReference
                                  ? `کد پیگیری: ${toFaDigits(ob.trackingReference)}`
                                  : "بدون کد پیگیری"}
                              </Typography>

                              <div className="flex items-center gap-2">
                                {canUpload && (
                                  <Button
                                    size="sm"
                                    variant="sun"
                                    leading={<Icons.Upload className="h-3.5 w-3.5" />}
                                    onClick={() => setUploadTarget(ob)}
                                  >
                                    {ob.status === "REJECTED"
                                      ? "ارسال مجدد رسید"
                                      : "ثبت رسید واریز"}
                                  </Button>
                                )}

                                {canReview && (
                                  <Button
                                    size="sm"
                                    variant="gold"
                                    leading={
                                      <Icons.CheckCircle2 className="h-3.5 w-3.5" />
                                    }
                                    onClick={() => setReviewTarget(ob)}
                                  >
                                    بررسی و تایید رسید
                                  </Button>
                                )}

                                {!canReview && ob.receiptImageUrl && (
                                  <Button
                                    size="sm"
                                    variant="tonal"
                                    onClick={() => setReviewTarget(ob)}
                                  >
                                    مشاهده رسید
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {tab === "MEMBERS" && (
          <section className="overflow-hidden rounded-card border border-white/8 bg-card divide-y divide-white/6 shadow-card">
            {group.members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={m.fullName}
                    hue={m.avatarHue}
                    size="md"
                    badge={
                      m.role === "OWNER"
                        ? "crown"
                        : m.hasWonPot
                        ? "check"
                        : undefined
                    }
                  />
                  <div className="min-w-0 space-y-0.5">
                    <Typography variant="label-md" className="truncate block">
                      {m.fullName}
                      {m.userId === user.id ? " (شما)" : ""}
                    </Typography>
                    <Typography
                      variant="label-sm"
                      tone={m.hasWonPot ? "success" : "muted"}
                      numeric
                    >
                      {m.hasWonPot
                        ? `دریافت‌کننده وام دور ${toFaDigits(m.wonRoundNumber)}`
                        : "در انتظار نوبت قرعه‌کشی"}
                    </Typography>
                  </div>
                </div>

                {isOwner && m.role !== "OWNER" ? (
                  <Button
                    variant="tonal"
                    size="sm"
                    leading={<Icons.RefreshCw className="h-3 w-3" />}
                    onClick={() => setReplaceTarget(m)}
                  >
                    جایگزینی
                  </Button>
                ) : (
                  <Typography
                    variant="label-sm"
                    tone={m.role === "OWNER" ? "sun" : "muted"}
                  >
                    {m.role === "OWNER" ? "مدیر صندوق" : "عضو"}
                  </Typography>
                )}
              </div>
            ))}
          </section>
        )}
      </main>

      <UploadReceiptSheet
        obligation={uploadTarget}
        demoMode={demoMode}
        onClose={() => setUploadTarget(null)}
        onDemoSubmit={(ob, tracking, previewUrl) =>
          demoStore.submitReceipt(ob.id, ob.roundId, tracking, previewUrl)
        }
        onSuccess={refreshAll}
      />

      <ReviewObligationSheet
        obligation={reviewTarget}
        canReview={
          Boolean(reviewTarget) &&
          (reviewTarget!.beneficiaryUserId === user.id || isOwner)
        }
        demoMode={demoMode}
        onClose={() => setReviewTarget(null)}
        onDemoConfirm={(ob) =>
          demoStore.confirmObligation(group.id, ob.id, ob.roundId)
        }
        onDemoReject={(ob, reason) =>
          demoStore.rejectObligation(ob.id, ob.roundId, reason)
        }
        onSuccess={refreshAll}
      />

      <GroupChatSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        groupId={group.id}
        currentUserId={user.id}
        messages={messages}
        demoMode={demoMode}
        onDemoSend={(content) => demoStore.sendChat(group.id, content)}
        onSent={(sent) =>
          queryClient.setQueryData<ChatMessage[]>(["chat", groupId], (old = []) =>
            old.some((m) => m.id === sent.id) ? old : [...old, sent]
          )
        }
      />

      <Sheet
        open={Boolean(replaceTarget)}
        onClose={() => setReplaceTarget(null)}
        title="جایگزینی عضو صندوق"
      >
        {replaceTarget && (
          <form onSubmit={handleReplaceMember} className="space-y-4">
            <Typography variant="body-sm" tone="muted">
              عضو فعلی{" "}
              <strong className="text-foreground">{replaceTarget.fullName}</strong>{" "}
              حذف شده و کاربر جدید جایگزین او در صندوق و اقساط آتی می‌شود.
            </Typography>
            <TextField
              label="شماره موبایل عضو جایگزین"
              inputMode="tel"
              maxLength={11}
              ltr
              numericNormalize
              value={replacementPhone}
              onChange={(e) => setReplacementPhone(onlyDigits(e.target.value))}
              onClear={() => setReplacementPhone("")}
              hint="عضو جایگزین باید قبلاً در گردون ثبت‌نام کرده باشد."
            />
            <Button type="submit" variant="sun" loading={busyAction} block>
              ثبت جایگزینی
            </Button>
          </form>
        )}
      </Sheet>
    </Shell>
  );
}
