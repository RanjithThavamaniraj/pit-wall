import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "./constants";
import { verifyAdminSessionToken } from "./session";

export function adminCredentialsConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_USERNAME?.trim() && process.env.ADMIN_PASSWORD?.trim()
  );
}

export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  const expectedUser = process.env.ADMIN_USERNAME?.trim();
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;

  if (username !== expectedUser) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expectedPass);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export async function getAdminSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdminSession(): Promise<{ username: string }> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
