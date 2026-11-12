import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildBackendTargetUrl, forwardToBackend } from "../backendProxy";

describe("backendProxy API route helper", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("constructs backend URL preserving nested segments and query parameters", () => {
    const target = buildBackendTargetUrl(
      ["groups", "42", "rounds"],
      "?tab=all&limit=10",
      "http://localhost:8080"
    );
    expect(target?.toString()).toBe("http://localhost:8080/api/groups/42/rounds?tab=all&limit=10");
  });

  it("rejects empty or path-traversal segments", () => {
    expect(buildBackendTargetUrl([], "", "http://localhost:8080")).toBeNull();
    expect(buildBackendTargetUrl(["groups", "..", "users"], "", "http://localhost:8080")).toBeNull();
    expect(buildBackendTargetUrl(["groups/etc"], "", "http://localhost:8080")).toBeNull();
  });

  it("returns 400 JSON without hitting upstream for invalid paths", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/groups/..");
    const res = await forwardToBackend(req, ["groups", ".."]);
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards headers, cookies, body and Set-Cookie upstream/downstream", async () => {
    const upstreamResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": "gardoon_refresh=token123; Path=/; HttpOnly",
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse);
    vi.stubGlobal("fetch", fetchMock);

    const req = new NextRequest("http://localhost:3000/api/auth/otp/verify?dev=1", {
      method: "POST",
      headers: {
        authorization: "Bearer jwt-abc",
        "content-type": "application/json",
        cookie: "gardoon_refresh=prev",
      },
      body: JSON.stringify({ phone: "09123456789", code: "12345" }),
    });

    const res = await forwardToBackend(req, ["auth", "otp", "verify"]);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("set-cookie")).toContain("gardoon_refresh=token123");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [target, init] = fetchMock.mock.calls[0]!;
    expect(String(target)).toBe("http://localhost:8080/api/auth/otp/verify?dev=1");
    expect((init as RequestInit).method).toBe("POST");
    const forwardedHeaders = (init as RequestInit).headers as Headers;
    expect(forwardedHeaders.get("authorization")).toBe("Bearer jwt-abc");
    expect(forwardedHeaders.get("cookie")).toBe("gardoon_refresh=prev");
  });

  it("returns 502 when upstream backend is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const req = new NextRequest("http://localhost:3000/api/auth/me");
    const res = await forwardToBackend(req, ["auth", "me"]);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.code).toBe("BACKEND_UNREACHABLE");
  });
});
