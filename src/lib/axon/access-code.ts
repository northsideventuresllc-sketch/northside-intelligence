import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_KEYLEN = 64;

export function generateAxonAccessCode(length = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}

export function hashAxonAccessCode(code: string, salt?: string): { hash: string; salt: string } {
  const normalized = code.trim();
  const useSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(normalized, useSalt, SCRYPT_KEYLEN).toString("hex");
  return { hash, salt: useSalt };
}

export function verifyAxonAccessCode(
  code: string,
  storedHash: string,
  salt: string
): boolean {
  const normalized = code.trim();
  if (!normalized || !storedHash || !salt) return false;
  const { hash } = hashAxonAccessCode(normalized, salt);
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
}
