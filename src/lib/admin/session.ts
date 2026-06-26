import { createHmac, timingSafeEqual } from "crypto";
import { ADMIN_SESSION_MAX_AGE_SECONDS } from "./constants";

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET must be set (min 16 characters)");
  }
  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken(username: string): string {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${username}:${expiresAt}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyAdminSessionToken(
  token: string | undefined | null
): { username: string } | null {
  if (!token) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = signPayload(payload);

  try {
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  const [username, expiresRaw] = payload.split(":");
  const expiresAt = Number(expiresRaw);
  if (!username || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null;
  }

  return { username };
}
