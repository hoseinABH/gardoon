import { NextResponse, type NextRequest } from "next/server";
import { ONBOARDING_COOKIE_NAME } from "@/features/onboarding/storage";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/" &&
    request.cookies.get(ONBOARDING_COOKIE_NAME)?.value === "1"
  ) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw\\.js$|manifest\\.webmanifest$|.*\\.(?:png|svg|jpg|jpeg|webp|ico|woff2)$).*)",
  ],
};
