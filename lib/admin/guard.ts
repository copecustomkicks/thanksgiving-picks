import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";

export async function isAdminRequest(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdmin(): Promise<void> {
  const ok = await isAdminRequest();
  if (!ok) throw new Error("Unauthorized");
}
