/**
 * Enquiry reference numbers.
 *
 * The reference is generated per submission and carried in both emails so the
 * team and the customer can quote the same string. It is **not** a database
 * key: no enquiry record is persisted anywhere, so the reference must never be
 * presented as something the business can look up on its own.
 *
 * Format: `GGI-YYMMDD-XXXXXX` — a UTC date stamp plus six Crockford base32
 * characters (no `I`, `L`, `O` or `U`, so nothing is misread when a customer
 * reads a reference out over the phone).
 */

import { randomBytes, randomUUID } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const SUFFIX_LENGTH = 6;

/** Matches anything this module can produce, for tests and for validation. */
export const ENQUIRY_REFERENCE_PATTERN = /^GGI-\d{6}-[0-9A-HJKMNP-TV-Z]{6}$/;

function dateStamp(now: Date): string {
  // 2026-11-15 -> "261115"
  return now.toISOString().slice(2, 10).replace(/-/g, "");
}

function suffix(): string {
  // randomBytes returns a full byte per character, and 256 / 32 is exact, so the
  // modulo introduces no bias across the alphabet.
  const bytes = randomBytes(SUFFIX_LENGTH);
  let out = "";
  for (let index = 0; index < SUFFIX_LENGTH; index += 1) {
    out += ALPHABET[bytes[index] % ALPHABET.length];
  }
  return out;
}

export function createEnquiryReference(now: Date = new Date()): string {
  return `GGI-${dateStamp(now)}-${suffix()}`;
}

/**
 * Opaque key for the Resend `Idempotency-Key` header. Used as a last line of
 * defence against a double submit that slipped past the disabled button.
 */
export function createRequestNonce(): string {
  return randomUUID();
}
