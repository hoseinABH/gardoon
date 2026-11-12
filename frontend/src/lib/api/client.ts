import type {
  AuthResponse,
  CalculationMode,
  ChatMessage,
  CycleInterval,
  DrawResult,
  GroupDetail,
  GroupSummary,
  Obligation,
  Round,
  UserProfile,
} from "./types";

const TOKEN_KEY = "gardoon_access_token";
const REFRESH_KEY = "gardoon_refresh_token";

export class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const errObj = json as { code?: string; message?: string } | null;
    throw new ApiClientError(
      res.status,
      errObj?.code ?? "API_ERROR",
      errObj?.message ?? "خطا در ارتباط با سرور"
    );
  }

  return json as T;
}

export const api = {
  auth: {
    sendOtp: (phoneNumber: string) =>
      request<{ ok: boolean; message: string; devCode?: string }>("/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
      }),
    verifyOtp: (phoneNumber: string, code: string, fullName?: string) =>
      request<AuthResponse>("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phoneNumber, code, fullName }),
      }),
    me: () => request<UserProfile>("/api/users/me"),
    updateBanking: (payload: {
      defaultCardNumber: string;
      defaultIban: string;
      defaultBankName?: string;
      defaultAccountHolder: string;
    }) =>
      request<UserProfile>("/api/users/me/banking", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  },

  groups: {
    list: () => request<GroupSummary[]>("/api/groups"),
    get: (id: string) => request<GroupDetail>(`/api/groups/${id}`),
    previewInvite: (code: string) =>
      request<GroupSummary>(`/api/groups/invite/${encodeURIComponent(code)}`),
    create: (payload: {
      title: string;
      calculationMode: CalculationMode;
      baseAmount: number;
      cycleInterval: CycleInterval;
      jalaliDueDay: number;
      gracePeriodHours?: number;
      startDate?: string;
    }) =>
      request<GroupDetail>("/api/groups", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    join: (inviteCode: string) =>
      request<GroupDetail>("/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
      }),
    launch: (groupId: string) =>
      request<GroupDetail>(`/api/groups/${groupId}/launch`, {
        method: "POST",
      }),
    replaceMember: (
      groupId: string,
      oldMemberUserId: string,
      replacementPhoneNumber: string
    ) =>
      request<GroupDetail>(`/api/groups/${groupId}/replace-member`, {
        method: "POST",
        body: JSON.stringify({ oldMemberUserId, replacementPhoneNumber }),
      }),
  },

  rounds: {
    list: (groupId: string) => request<Round[]>(`/api/groups/${groupId}/rounds`),
    draw: (roundId: string) =>
      request<DrawResult>(`/api/rounds/${roundId}/draw`, {
        method: "POST",
      }),
  },

  obligations: {
    listForRound: (roundId: string) =>
      request<Obligation[]>(`/api/rounds/${roundId}/obligations`),
    submitReceipt: (
      obligationId: string,
      file: File,
      trackingReference: string,
      idempotencyKey: string
    ) => {
      const form = new FormData();
      form.append("file", file);
      if (trackingReference.trim()) {
        form.append("trackingReference", trackingReference.trim());
      }
      return request<Obligation>(`/api/obligations/${obligationId}/receipt`, {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        body: form,
      });
    },
    confirm: (obligationId: string) =>
      request<Obligation>(`/api/obligations/${obligationId}/confirm`, {
        method: "POST",
      }),
    reject: (obligationId: string, reason: string) =>
      request<Obligation>(`/api/obligations/${obligationId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    fetchReceiptBlobUrl: async (receiptUrl: string): Promise<string> => {
      const token = getAccessToken();
      const res = await fetch(receiptUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error("تصویر رسید قابل بارگذاری نیست");
      }
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
  },

  chat: {
    list: (groupId: string, page = 0, size = 50) =>
      request<ChatMessage[]>(
        `/api/groups/${groupId}/chat?page=${page}&size=${size}`
      ),
    send: (groupId: string, content: string) =>
      request<ChatMessage>(`/api/groups/${groupId}/chat`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },
};
