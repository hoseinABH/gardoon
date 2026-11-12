"use client";

import { create } from "zustand";
import type {
  CalculationMode,
  ChatMessage,
  CycleInterval,
  GroupDetail,
  Obligation,
} from "@/lib/api/types";
import {
  DEMO_USER,
  INITIAL_DEMO_CHAT,
  INITIAL_DEMO_GROUPS,
  INITIAL_DEMO_OBLIGATIONS,
} from "./demoData";
import { toFaDigits } from "@/lib/format/digits";

interface DemoState {
  groups: GroupDetail[];
  obligationsByRound: Record<string, Obligation[]>;
  chatByGroup: Record<string, ChatMessage[]>;
  createGroup: (input: {
    title: string;
    calculationMode: CalculationMode;
    baseAmount: number;
    cycleInterval: CycleInterval;
    jalaliDueDay: number;
  }) => GroupDetail;
  launchGroup: (groupId: string) => void;
  drawRound: (groupId: string, roundId: string) => void;
  submitReceipt: (
    obligationId: string,
    roundId: string,
    trackingReference: string,
    previewUrl: string
  ) => void;
  confirmObligation: (groupId: string, obligationId: string, roundId: string) => void;
  rejectObligation: (obligationId: string, roundId: string, reason: string) => void;
  sendChat: (groupId: string, content: string) => void;
}

export const useDemoStore = create<DemoState>((set) => ({
  groups: INITIAL_DEMO_GROUPS,
  obligationsByRound: INITIAL_DEMO_OBLIGATIONS,
  chatByGroup: INITIAL_DEMO_CHAT,

  createGroup: (input) => {
    const id = `demo-group-${Date.now()}`;
    const newGroup: GroupDetail = {
      id,
      title: input.title,
      ownerId: DEMO_USER.id,
      ownerName: DEMO_USER.fullName,
      calculationMode: input.calculationMode,
      baseAmount: input.baseAmount,
      totalPotAmount: input.baseAmount,
      perMemberShare: input.baseAmount,
      currency: "IRT",
      cycleInterval: input.cycleInterval,
      jalaliDueDay: input.jalaliDueDay,
      startDate: new Date().toISOString().slice(0, 10),
      gracePeriodHours: 48,
      status: "RECRUITING",
      inviteCode: `GRD-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      members: [
        {
          userId: DEMO_USER.id,
          fullName: DEMO_USER.fullName,
          phoneNumber: DEMO_USER.phoneNumber,
          avatarUrl: null,
          avatarHue: DEMO_USER.avatarHue,
          role: "OWNER",
          status: "ACTIVE",
          hasWonPot: false,
          wonRoundNumber: null,
          defaultCardNumber: DEMO_USER.defaultCardNumber,
          defaultIban: DEMO_USER.defaultIban,
          defaultBankName: DEMO_USER.defaultBankName,
          defaultAccountHolder: DEMO_USER.defaultAccountHolder,
          joinedAt: new Date().toISOString(),
        },
        {
          userId: "demo-friend-a",
          fullName: "نیما فرهادی",
          phoneNumber: "09125551234",
          avatarUrl: null,
          avatarHue: 220,
          role: "MEMBER",
          status: "ACTIVE",
          hasWonPot: false,
          wonRoundNumber: null,
          defaultCardNumber: "6037991234567893",
          defaultIban: null,
          defaultBankName: "بانک ملی ایران",
          defaultAccountHolder: "نیما فرهادی",
          joinedAt: new Date().toISOString(),
        },
      ],
      rounds: [],
    };
    set((s) => ({
      groups: [newGroup, ...s.groups],
      chatByGroup: {
        ...s.chatByGroup,
        [id]: [
          {
            id: `c-${Date.now()}`,
            groupId: id,
            senderId: null,
            senderName: "سامانه گردون",
            senderAvatarHue: 150,
            messageType: "SYSTEM_EVENT",
            content: `صندوق «${input.title}» ایجاد شد.`,
            relatedObligationId: null,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    }));
    return newGroup;
  },

  launchGroup: (groupId) =>
    set((s) => ({
      groups: s.groups.map((g) => {
        if (g.id !== groupId) return g;
        const n = g.members.length;
        const share =
          g.calculationMode === "TARGET_POT"
            ? Math.floor(g.baseAmount / Math.max(1, n - 1))
            : g.baseAmount;
        const pot = share * Math.max(1, n - 1);
        return {
          ...g,
          status: "ACTIVE",
          totalPotAmount: pot,
          perMemberShare: share,
          rounds: g.members.map((_, idx) => ({
            id: `${groupId}-r-${idx + 1}`,
            groupId,
            roundNumber: idx + 1,
            dueDate: new Date().toISOString().slice(0, 10),
            jalaliDueDateLabel: `۱۴۰۴/${toFaDigits(String(idx + 1).padStart(2, "0"))}/${toFaDigits(g.jalaliDueDay)}`,
            beneficiaryUserId: null,
            beneficiaryName: null,
            beneficiaryAvatarUrl: null,
            payoutCardSnapshot: null,
            payoutIbanSnapshot: null,
            payoutBankSnapshot: null,
            payoutHolderSnapshot: null,
            totalPotAmount: pot,
            perMemberShare: share,
            drawTargetAngle: null,
            drawCompletedAt: null,
            status: "PENDING_DRAW",
          })),
        };
      }),
    })),

  drawRound: (groupId, roundId) =>
    set((s) => {
      const group = s.groups.find((g) => g.id === groupId);
      if (!group) return s;
      const eligible = group.members.filter((m) => !m.hasWonPot);
      if (eligible.length === 0) return s;
      const winner = eligible[Math.floor(Math.random() * eligible.length)];
      const round = group.rounds.find((r) => r.id === roundId);
      if (!round) return s;

      const newObs: Obligation[] = group.members
        .filter((m) => m.userId !== winner.userId)
        .map((m) => ({
          id: `ob-${roundId}-${m.userId}`,
          roundId,
          roundNumber: round.roundNumber,
          payerUserId: m.userId,
          payerName: m.fullName,
          payerPhoneNumber: m.phoneNumber,
          payerAvatarHue: m.avatarHue,
          beneficiaryUserId: winner.userId,
          beneficiaryName: winner.fullName,
          amount: round.perMemberShare,
          status: "PENDING",
          receiptImageUrl: null,
          trackingReference: null,
          rejectionReason: null,
          submittedAt: null,
          confirmedAt: null,
        }));

      return {
        groups: s.groups.map((g) =>
          g.id !== groupId
            ? g
            : {
                ...g,
                members: g.members.map((m) =>
                  m.userId === winner.userId
                    ? { ...m, hasWonPot: true, wonRoundNumber: round.roundNumber }
                    : m
                ),
                rounds: g.rounds.map((r) =>
                  r.id === roundId
                    ? {
                        ...r,
                        status: "COLLECTING",
                        beneficiaryUserId: winner.userId,
                        beneficiaryName: winner.fullName,
                        payoutCardSnapshot: winner.defaultCardNumber,
                        payoutIbanSnapshot: winner.defaultIban,
                        payoutBankSnapshot: winner.defaultBankName,
                        payoutHolderSnapshot:
                          winner.defaultAccountHolder ?? winner.fullName,
                        drawCompletedAt: new Date().toISOString(),
                      }
                    : r
                ),
              }
        ),
        obligationsByRound: {
          ...s.obligationsByRound,
          [roundId]: newObs,
        },
        chatByGroup: {
          ...s.chatByGroup,
          [groupId]: [
            ...(s.chatByGroup[groupId] ?? []),
            {
              id: `c-${Date.now()}`,
              groupId,
              senderId: null,
              senderName: "سامانه گردون",
              senderAvatarHue: 150,
              messageType: "SYSTEM_EVENT",
              content: `قرعه‌کشی دور ${toFaDigits(round.roundNumber)} انجام شد. برنده: ${winner.fullName}`,
              relatedObligationId: null,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      };
    }),

  submitReceipt: (obligationId, roundId, trackingReference, previewUrl) =>
    set((s) => ({
      obligationsByRound: {
        ...s.obligationsByRound,
        [roundId]: (s.obligationsByRound[roundId] ?? []).map((ob) =>
          ob.id === obligationId
            ? {
                ...ob,
                status: "RECEIPT_SUBMITTED",
                trackingReference: trackingReference || null,
                receiptImageUrl: previewUrl,
                rejectionReason: null,
                submittedAt: new Date().toISOString(),
              }
            : ob
        ),
      },
    })),

  confirmObligation: (groupId, obligationId, roundId) =>
    set((s) => {
      const updatedObs = (s.obligationsByRound[roundId] ?? []).map((ob) =>
        ob.id === obligationId
          ? {
              ...ob,
              status: "CONFIRMED" as const,
              confirmedAt: new Date().toISOString(),
            }
          : ob
      );
      const allConfirmed =
        updatedObs.length > 0 && updatedObs.every((o) => o.status === "CONFIRMED");

      return {
        obligationsByRound: {
          ...s.obligationsByRound,
          [roundId]: updatedObs,
        },
        groups: s.groups.map((g) => {
          if (g.id !== groupId) return g;
          const rounds = g.rounds.map((r) =>
            r.id === roundId && allConfirmed ? { ...r, status: "SETTLED" as const } : r
          );
          const allSettled = rounds.every((r) => r.status === "SETTLED");
          return {
            ...g,
            rounds,
            status: allSettled ? ("COMPLETED" as const) : g.status,
          };
        }),
      };
    }),

  rejectObligation: (obligationId, roundId, reason) =>
    set((s) => ({
      obligationsByRound: {
        ...s.obligationsByRound,
        [roundId]: (s.obligationsByRound[roundId] ?? []).map((ob) =>
          ob.id === obligationId
            ? {
                ...ob,
                status: "REJECTED" as const,
                rejectionReason: reason,
              }
            : ob
        ),
      },
    })),

  sendChat: (groupId, content) =>
    set((s) => ({
      chatByGroup: {
        ...s.chatByGroup,
        [groupId]: [
          ...(s.chatByGroup[groupId] ?? []),
          {
            id: `c-${Date.now()}`,
            groupId,
            senderId: DEMO_USER.id,
            senderName: DEMO_USER.fullName,
            senderAvatarHue: DEMO_USER.avatarHue,
            messageType: "TEXT",
            content,
            relatedObligationId: null,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    })),
}));
