"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Avatar,
  IconButton,
  Icons,
  Loader,
  Sheet,
  TextField,
  Typography,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import type { ChatMessage } from "@/lib/api/types";
import { formatJalaliTime } from "@/lib/format/jalali";

export function GroupChatSheet({
  open,
  onClose,
  groupId,
  currentUserId,
  messages,
  demoMode,
  onDemoSend,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  currentUserId: string;
  messages: ChatMessage[];
  demoMode: boolean;
  onDemoSend: (content: string) => void;
  onSent: (msg: ChatMessage) => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages.length]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    if (demoMode) {
      onDemoSend(content);
      setText("");
      return;
    }

    setSending(true);
    try {
      const sent = await api.chat.send(groupId, content);
      onSent(sent);
      setText("");
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "خطا در ارسال پیام";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="گفتگو و رویدادهای صندوق">
      <div className="flex h-chat-panel flex-col justify-between gap-3">
        <div className="flex-1 space-y-2.5 overflow-y-auto pe-1 no-scrollbar">
          {messages.length === 0 ? (
            <Typography variant="body-sm" tone="muted" className="py-12 text-center">
              هنوز پیامی ثبت نشده است.
            </Typography>
          ) : (
            messages.map((m) => {
              if (m.messageType === "SYSTEM_EVENT") {
                return (
                  <div key={m.id} className="flex justify-center py-1">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-center">
                      <Typography variant="label-sm" tone="muted">
                        {m.content}
                      </Typography>
                    </span>
                  </div>
                );
              }

              const isMine = m.senderId === currentUserId;
              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${
                    isMine ? "flex-row-reverse" : ""
                  }`}
                >
                  {!isMine && (
                    <Avatar
                      name={m.senderName}
                      hue={m.senderAvatarHue}
                      size="xs"
                    />
                  )}
                  <div
                    className={`max-w-4/5 rounded-2xl px-3.5 py-2 ${
                      isMine
                        ? "bg-primary text-on-primary rounded-ee-sm"
                        : m.messageType === "RECEIPT_CARD"
                        ? "border border-gold/40 bg-gold/10 text-foreground rounded-es-sm"
                        : "bg-elevated text-foreground rounded-es-sm"
                    }`}
                  >
                    {!isMine && (
                      <Typography
                        variant="label-sm"
                        tone="inherit"
                        className="mb-0.5 block opacity-75 font-bold"
                      >
                        {m.senderName}
                      </Typography>
                    )}
                    <Typography variant="body-sm" tone="inherit">
                      {m.content}
                    </Typography>
                    <Typography
                      variant="label-sm"
                      tone="inherit"
                      numeric
                      className="mt-1 block text-end text-nano opacity-65"
                    >
                      {formatJalaliTime(m.createdAt)}
                    </Typography>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 pt-2 border-t border-white/8"
        >
          <div className="flex-1">
            <TextField
              label="پیام جدید"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onClear={() => setText("")}
            />
          </div>
          <IconButton
            type="submit"
            variant="filled"
            size="lg"
            aria-label="ارسال پیام"
            disabled={sending || !text.trim()}
            className="h-12 w-12"
          >
            {sending ? <Loader size="sm" /> : <Icons.Send className="h-4 w-4" />}
          </IconButton>
        </form>
      </div>
    </Sheet>
  );
}
