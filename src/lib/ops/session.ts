/** Ops session lifetime — matches cookie max-age (7 days). */
export const OPS_SESSION_TTL_SEC = 60 * 60 * 24 * 7;

export const OPS_COOKIE = "ni_ops_token";

interface OpsSessionPayload {
  exp: number;
  iat: number;
  sid: string;
}

function getSessionSecret(): string | null {
  return process.env.OPS_SESSION_SECRET ?? null;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret)
  );
  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array | null {
  try {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function signPayload(payloadB64: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return base64urlEncode(new Uint8Array(sig));
}

async function verifySignature(
  payloadB64: string,
  signatureB64: string,
  secret: string
): Promise<boolean> {
  const sigBytes = base64urlDecode(signatureB64);
  if (!sigBytes) return false;
  const key = await importHmacKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    Uint8Array.from(sigBytes),
    new TextEncoder().encode(payloadB64)
  );
}

export async function mintOpsSessionToken(): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Missing OPS_SESSION_SECRET");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: OpsSessionPayload = {
    exp: now + OPS_SESSION_TTL_SEC,
    iat: now,
    sid: crypto.randomUUID(),
  };
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await signPayload(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifyOpsSessionToken(token: string | undefined): Promise<boolean> {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  if (!payloadB64 || !sigB64) return false;

  const validSig = await verifySignature(payloadB64, sigB64, secret);
  if (!validSig) return false;

  const payloadBytes = base64urlDecode(payloadB64);
  if (!payloadBytes) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as OpsSessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
