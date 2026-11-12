export type CalculationMode = "TARGET_POT" | "FIXED_CONTRIBUTION";
export type CycleInterval = "WEEKLY" | "MONTHLY";
export type GroupStatus = "RECRUITING" | "ACTIVE" | "COMPLETED" | "PAUSED";
export type MemberRole = "OWNER" | "MEMBER";
export type MemberStatus = "INVITED" | "ACTIVE" | "REMOVED";
export type RoundStatus = "PENDING_DRAW" | "COLLECTING" | "SETTLED";
export type ObligationStatus = "PENDING" | "RECEIPT_SUBMITTED" | "CONFIRMED" | "REJECTED";
export type ChatMessageType = "TEXT" | "SYSTEM_EVENT" | "RECEIPT_CARD";

export interface UserProfile {
  id: string;
  phoneNumber: string;
  fullName: string;
  avatarUrl: string | null;
  avatarHue: number;
  defaultCardNumber: string | null;
  defaultIban: string | null;
  defaultBankName: string | null;
  defaultAccountHolder: string | null;
  hasBankingDetails?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserProfile;
}

export interface GroupSummary {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  calculationMode: CalculationMode;
  baseAmount: number;
  estimatedPotAmount: number;
  estimatedPerMemberShare: number;
  currency: string;
  cycleInterval: CycleInterval;
  jalaliDueDay: number;
  startDate: string;
  gracePeriodHours: number;
  status: GroupStatus;
  inviteCode: string;
  memberCount: number;
  completedRounds: number;
  totalRounds: number;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  avatarHue: number;
  role: MemberRole;
  status: MemberStatus;
  hasWonPot: boolean;
  wonRoundNumber: number | null;
  defaultCardNumber: string | null;
  defaultIban: string | null;
  defaultBankName: string | null;
  defaultAccountHolder: string | null;
  joinedAt: string;
}

export interface Round {
  id: string;
  groupId: string;
  roundNumber: number;
  dueDate: string;
  jalaliDueDateLabel: string;
  beneficiaryUserId: string | null;
  beneficiaryName: string | null;
  beneficiaryAvatarUrl: string | null;
  payoutCardSnapshot: string | null;
  payoutIbanSnapshot: string | null;
  payoutBankSnapshot: string | null;
  payoutHolderSnapshot: string | null;
  totalPotAmount: number;
  perMemberShare: number;
  drawTargetAngle: number | null;
  drawCompletedAt: string | null;
  status: RoundStatus;
}

export interface GroupDetail {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  calculationMode: CalculationMode;
  baseAmount: number;
  totalPotAmount: number;
  perMemberShare: number;
  currency: string;
  cycleInterval: CycleInterval;
  jalaliDueDay: number;
  startDate: string;
  gracePeriodHours: number;
  status: GroupStatus;
  inviteCode: string;
  members: GroupMember[];
  rounds: Round[];
  createdAt: string;
}

export interface DrawResult {
  roundId: string;
  roundNumber: number;
  winnerUserId: string;
  winnerName: string;
  winnerAvatarUrl: string | null;
  targetAngle: number;
  sliceIndex: number;
  drawSeed: string;
  potAmount: number;
  completedAt: string;
}

export interface Obligation {
  id: string;
  roundId: string;
  roundNumber: number;
  payerUserId: string;
  payerName: string;
  payerPhoneNumber: string;
  payerAvatarHue: number;
  beneficiaryUserId: string;
  beneficiaryName: string;
  amount: number;
  status: ObligationStatus;
  receiptImageUrl: string | null;
  trackingReference: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  confirmedAt: string | null;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string | null;
  senderName: string;
  senderAvatarHue: number;
  messageType: ChatMessageType;
  content: string;
  relatedObligationId: string | null;
  createdAt: string;
}
