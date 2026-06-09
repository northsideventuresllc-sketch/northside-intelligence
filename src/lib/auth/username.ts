const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export function isValidUsername(value: string): boolean {
  return USERNAME_RE.test(value);
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}
