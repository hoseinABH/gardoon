import { NextResponse, type NextRequest } from "next/server";

const FORWARDED_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "cookie",
  "idempotency-key",
];

export function resolveBackendOrigin(): string {
  return (process.env.BACKEND_INTERNAL_URL || "http://localhost:8080").replace(/\/$/, "");
}

export function buildBackendTargetUrl(
  segments: string[],
  search: string,
  origin = resolveBackendOrigin()
): URL | null {
  if (
    segments.length === 0 ||
    segments.some((s) => !s || s === "." || s === ".." || /[\\/]/.test(s))
  ) {
    return null;
  }

  const encodedPath = segments.map((s) => encodeURIComponent(s)).join("/");
  const target = new URL(`/api/${encodedPath}`, origin);
  target.search = search;

  if (!target.href.startsWith(origin)) {
    return null;
  }
  return target;
}

export async function forwardToBackend(
  request: NextRequest,
  segments: string[]
): Promise<Response> {
  const target = buildBackendTargetUrl(segments, request.nextUrl.search);
  if (!target) {
    return NextResponse.json(
      { code: "INVALID_PROXY_PATH", message: "مسیر درخواست نامعتبر است" },
      { status: 400 }
    );
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const val = request.headers.get(name);
    if (val) headers.set(name, val);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    const cacheControl = upstream.headers.get("cache-control");
    if (cacheControl) responseHeaders.set("cache-control", cacheControl);

    // Forward HttpOnly Set-Cookie headers cleanly
    const getSetCookie = (upstream.headers as unknown as { getSetCookie?: () => string[] })
      .getSetCookie;
    const cookies =
      typeof getSetCookie === "function"
        ? getSetCookie.call(upstream.headers)
        : upstream.headers.get("set-cookie")
        ? [upstream.headers.get("set-cookie")!]
        : [];
    for (const cookie of cookies) {
      responseHeaders.append("set-cookie", cookie);
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { code: "BACKEND_UNREACHABLE", message: "ارتباط با سرور گردون برقرار نشد" },
      { status: 502 }
    );
  }
}
