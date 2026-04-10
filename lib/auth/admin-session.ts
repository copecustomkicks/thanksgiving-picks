import { SignJWT, jwtVerify } from "jose";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";

const getSecret = () => {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
};

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminSessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export { ADMIN_COOKIE_NAME };
