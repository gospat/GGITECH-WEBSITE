/**
 * Shared input-coercion helpers used by every API route so validation behaves
 * identically across endpoints.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function asString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function clampText(input: string, max: number): string {
  if (input.length <= max) return input;
  return input.slice(0, max).trim();
}

export function isEmail(email: string): boolean {
  if (!email) return false;
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Guards values that end up in mail headers (display names, subjects) against
 * CRLF injection.
 */
export function isSafeHeaderValue(value: string): boolean {
  return !/[\r\n]/.test(value);
}
