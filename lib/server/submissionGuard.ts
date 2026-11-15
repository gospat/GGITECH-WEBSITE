/**
 * Short-window duplicate submission guard.
 *
 * A visitor who double-clicks submit, or whose browser replays the POST, sends
 * two identical bodies within milliseconds. The forms disable their button
 * while a request is in flight, but that is client-side and cannot be trusted,
 * so the same protection is enforced here.
 *
 * This is deliberately *not* folded into `rateLimit`. A rate limiter consumes
 * on arrival, so a submission that then failed to send would leave the visitor
 * locked out of retrying it, and reporting a retry as success would be a lie.
 * A fingerprint is recorded only once a submission has actually been accepted,
 * which means a failed attempt is always retryable and a duplicate is only ever
 * answered with success when the original genuinely succeeded.
 *
 * State is per process. The service runs as a single Node process behind nginx,
 * so that is equivalent to per deployment; a multi-instance deployment would
 * need a shared store, exactly like the rate limiter.
 */

import { createHash } from "node:crypto";

/** Long enough to absorb a double click, short enough not to block a genuine resend. */
const WINDOW_MS = 2 * 60 * 1000;

/** Hard ceiling so a client cycling distinct payloads cannot grow the map without end. */
const MAX_ENTRIES = 5_000;

type Accepted = { at: number; reference: string };

const accepted = new Map<string, Accepted>();

function sweep(now: number): void {
  for (const [key, entry] of accepted) {
    if (now - entry.at > WINDOW_MS) accepted.delete(key);
  }
}

/**
 * Stable fingerprint of the fields that make a submission what it is. The
 * IP is not part of it: the same person resubmitting from a new address is a
 * different event, and the guard exists for identical bodies, not for people.
 *
 * Each part is length-prefixed before hashing. Without that, a value that
 * happens to contain the separator could make two different submissions hash
 * identically, and the second one would be answered as a duplicate without
 * ever reaching the team.
 */
export function submissionFingerprint(parts: string[]): string {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(`${part.length}:`);
    hash.update(part);
  }
  return hash.digest("hex");
}

/**
 * The reference of the enquiry this exact body was already accepted as, or
 * `null` if it has not been seen. Returning the original reference lets the
 * second request answer with the same success the first one did.
 */
export function recallSubmission(fingerprint: string): string | null {
  const now = Date.now();
  const entry = accepted.get(fingerprint);
  if (entry === undefined) return null;

  if (now - entry.at > WINDOW_MS) {
    accepted.delete(fingerprint);
    return null;
  }

  return entry.reference;
}

/** Call this only after the enquiry has been accepted, never before. */
export function rememberSubmission(fingerprint: string, reference: string): void {
  const now = Date.now();

  if (accepted.size >= MAX_ENTRIES) {
    sweep(now);
    while (accepted.size >= MAX_ENTRIES) {
      const oldest = accepted.keys().next();
      if (oldest.done) break;
      accepted.delete(oldest.value);
    }
  }

  accepted.set(fingerprint, { at: now, reference });
}
