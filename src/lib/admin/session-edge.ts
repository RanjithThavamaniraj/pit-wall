function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function signPayloadEdge(
  payload: string,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return base64UrlEncode(new Uint8Array(signature));
}

export async function verifyAdminSessionTokenEdge(
  token: string | undefined | null
): Promise<{ username: string } | null> {
  if (!token) return null;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = await signPayloadEdge(payload, secret);

  if (!timingSafeEqual(signature, expected)) return null;

  const [username, expiresRaw] = payload.split(":");
  const expiresAt = Number(expiresRaw);
  if (!username || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null;
  }

  return { username };
}
