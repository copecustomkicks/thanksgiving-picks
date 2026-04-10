import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
} from "@/lib/auth/admin-session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
