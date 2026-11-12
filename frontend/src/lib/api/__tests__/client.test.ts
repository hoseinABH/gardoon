import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "../client";
import { useAuthStore } from "@/features/auth/store";

describe("API client 401 expiration and refresh handling", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearAuthTokens();
    useAuthStore.setState({
      user: {
        id: "u1",
        phoneNumber: "09123456789",
        fullName: "تست",
        avatarUrl: null,
        avatarHue: 160,
        defaultCardNumber: null,
        defaultIban: null,
        defaultBankName: null,
        defaultAccountHolder: null,
      },
      demoMode: false,
      hydrated: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("silently refreshes access token and retries request when access token expired with 401", async () => {
    setAuthTokens("expired-access", "valid-refresh");

    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      if (url === "/api/groups") {
        if (callCount === 1) {
          // First call: 401 expired
          return new Response(JSON.stringify({ code: "TOKEN_EXPIRED" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        // Second call (retry): 200 OK
        return new Response(JSON.stringify([{ id: "box-1", title: "صندوق ۱" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/auth/refresh") {
        return new Response(
          JSON.stringify({
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(null, { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await api.groups.list();
    expect(result).toEqual([{ id: "box-1", title: "صندوق ۱" }]);
    expect(getAccessToken()).toBe("new-access-token");
    expect(getRefreshToken()).toBe("new-refresh-token");
  });

  it("clears tokens and logs out user when refresh token also fails with 401", async () => {
    setAuthTokens("expired-access", "expired-refresh");

    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === "/api/groups") {
        return new Response(JSON.stringify({ code: "UNAUTHORIZED" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === "/api/auth/refresh") {
        return new Response(JSON.stringify({ code: "REFRESH_EXPIRED" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(null, { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(api.groups.list()).rejects.toThrow();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
