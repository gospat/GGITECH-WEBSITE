import { describe, expect, it, vi } from "vitest";

import {
  recallSubmission,
  rememberSubmission,
  submissionFingerprint,
} from "@/lib/server/submissionGuard";

/** Every test uses its own fields so the shared map cannot leak between them. */
function fingerprint(...parts: string[]): string {
  return submissionFingerprint([`test:${Math.random()}`, ...parts]);
}

describe("submissionFingerprint", () => {
  it("is stable for identical input", () => {
    const parts = ["contact", "Ada", "ada@example.com", "", "Hello there"];

    expect(submissionFingerprint(parts)).toBe(submissionFingerprint(parts));
  });

  it("changes when any single field changes", () => {
    const base = ["contact", "Ada", "ada@example.com", "", "Hello there"];

    for (let index = 0; index < base.length; index += 1) {
      const changed = [...base];
      changed[index] = `${changed[index]}!`;
      expect(submissionFingerprint(changed)).not.toBe(submissionFingerprint(base));
    }
  });

  it("does not collide when a field value contains the separator", () => {
    // Naive joining would make these two identical.
    expect(submissionFingerprint(["a\u0000", "b"])).not.toBe(
      submissionFingerprint(["a", "\u0000b"])
    );
    expect(submissionFingerprint(["ab"])).not.toBe(submissionFingerprint(["a", "b"]));
  });
});

describe("submission guard", () => {
  it("does not recall a submission that was never remembered", () => {
    expect(recallSubmission(fingerprint("never-accepted"))).toBeNull();
  });

  it("recalls the reference once the submission has been accepted", () => {
    const key = fingerprint("accepted");

    rememberSubmission(key, "GGI-261115-7QK4ZP");

    expect(recallSubmission(key)).toBe("GGI-261115-7QK4ZP");
  });

  it("keeps a failed attempt retryable, because nothing was remembered", () => {
    // The route calls rememberSubmission only after the provider accepted the
    // notification, so this is the state a failed send leaves behind.
    const key = fingerprint("failed-send");

    expect(recallSubmission(key)).toBeNull();
  });

  it("stops recalling a submission after the window has passed", () => {
    vi.useFakeTimers();
    try {
      const key = fingerprint("expiring");
      rememberSubmission(key, "GGI-261115-7QK4ZP");

      expect(recallSubmission(key)).toBe("GGI-261115-7QK4ZP");

      vi.advanceTimersByTime(2 * 60 * 1000 + 1);

      expect(recallSubmission(key)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("stays bounded when a client cycles distinct payloads", () => {
    // Far more distinct submissions than the ceiling allows; the map must not
    // grow without end, and must not throw while evicting.
    for (let index = 0; index < 6_000; index += 1) {
      rememberSubmission(submissionFingerprint([`flood:${index}`]), "GGI-261115-7QK4ZP");
    }

    // The most recent entry survives the eviction pass.
    expect(recallSubmission(submissionFingerprint(["flood:5999"]))).toBe("GGI-261115-7QK4ZP");
  });
});
