import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";
import { updateSession } from "@/lib/supabase/middleware";

const getSecret = () => {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) return null;
  return new TextEncoder().encode(s);
};

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const secret = getSecret();
    if (!token || !secret) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== "admin") throw new Error("deny");
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
