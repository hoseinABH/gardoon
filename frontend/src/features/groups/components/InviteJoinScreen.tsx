"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  Icons,
  Shell,
  StatusBadge,
  TopBar,
  Typography,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import { useAuthStore } from "@/features/auth/store";
import { toFaDigits } from "@/lib/format/digits";
import { formatToman } from "@/lib/format/money";

export function InviteJoinScreen({ code }: { code: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [joining, setJoining] = useState(false);

  const { data: preview, isLoading, error } = useQuery({
    queryKey: ["invite-preview", code],
    queryFn: () => api.groups.previewInvite(code),
  });

  const handleJoin = async () => {
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(`/join/${code}`)}`);
      return;
    }
    setJoining(true);
    try {
      const joined = await api.groups.join(code);
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success(`به صندوق «${joined.title}» پیوستید`);
      router.replace(`/groups/${joined.id}`);
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "عضویت در صندوق انجام نشد";
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Shell>
      <TopBar title="دعوت‌نامه عضویت در صندوق" backTo="/home" />

      <main className="flex flex-1 flex-col justify-center px-5 py-8">
        {isLoading ? (
          <div className="h-60 animate-pulse rounded-3xl bg-card border border-white/8" />
        ) : error || !preview ? (
          <div className="rounded-3xl border border-destructive/30 bg-card p-6 text-center space-y-4">
            <Typography variant="title-md">کد دعوت معتبر نیست</Typography>
            <Typography variant="body-sm" tone="muted">
              احتمالاً کد دعوت «{code}» اشتباه وارد شده یا صندوقی با این کد
              وجود ندارد.
            </Typography>
            <Button
              variant="tonal"
              size="md"
              onClick={() => router.push("/home")}
            >
              بازگشت به خانه
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-hero bg-hero border border-white/10 p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <Icons.ShieldCheck className="h-4 w-4" />
                  <Typography variant="label-md" tone="primary">
                    دعوت رسمی از سوی {preview.ownerName}
                  </Typography>
                </span>
                <StatusBadge status={preview.status} />
              </div>

              <Typography variant="title-lg" as="h2">
                {preview.title}
              </Typography>

              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-black/25 p-3.5">
                <div>
                  <Typography variant="label-sm" tone="muted" className="block">
                    مبلغ وام هر دوره
                  </Typography>
                  <Typography variant="title-sm" tone="primary" numeric>
                    {formatToman(preview.estimatedPotAmount)}
                  </Typography>
                </div>
                <div>
                  <Typography variant="label-sm" tone="muted" className="block">
                    سهم تقریبی
                  </Typography>
                  <Typography variant="title-sm" numeric>
                    {formatToman(preview.estimatedPerMemberShare)}
                  </Typography>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-muted-foreground">
                  <Icons.Users className="h-3.5 w-3.5 text-primary" />
                  <Typography variant="label-sm" tone="muted" numeric>
                    {toFaDigits(preview.memberCount)} عضو فعلی
                  </Typography>
                </div>
                <div className="pt-1">
                  <Typography variant="label-sm" tone="muted">
                    دوره: {preview.cycleInterval === "WEEKLY" ? "هفتگی" : "ماهانه"}
                  </Typography>
                </div>
              </div>
            </div>

            <Button
              variant="sun"
              block
              loading={joining}
              trailing={<Icons.ArrowLeft className="h-4 w-4" />}
              onClick={handleJoin}
            >
              {user
                ? "پذیرش دعوت و عضویت در صندوق"
                : "ورود و عضویت در صندوق"}
            </Button>
          </div>
        )}
      </main>
    </Shell>
  );
}
