import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EmailConfigError } from "@/lib/server/email/errors";
import { EMAIL_REQUEST_TIMEOUT_MS, getEmailEnv } from "@/lib/server/email/config";

const KEYS = [
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "CONTACT_NOTIFICATION_EMAIL",
  "CONTACT_REPLY_TO_EMAIL",
  "CONTACT_AUTO_REPLY_ENABLED",
] as const;

const before = new Map<string, string | undefined>();

beforeEach(() => {
  for (const key of KEYS) before.set(key, process.env[key]);
  for (const key of KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of KEYS) {
    const value = before.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function configure(overrides: Partial<Record<(typeof KEYS)[number], string>> = {}): void {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "GGITECH <notifications@ggitech.dev>";
  process.env.CONTACT_NOTIFICATION_EMAIL = "owner@example-inbox.com";
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("getEmailEnv", () => {
  it("reads a complete configuration", () => {
    configure();

    expect(getEmailEnv()).toEqual({
      apiKey: "re_test_key",
      from: "GGITECH <notifications@ggitech.dev>",
      notificationEmail: "owner@example-inbox.com",
      replyToEmail: "owner@example-inbox.com",
      autoReplyEnabled: true,
      requestTimeoutMs: EMAIL_REQUEST_TIMEOUT_MS,
    });
  });

  it("fails closed when the API key is absent", () => {
    configure();
    delete process.env.RESEND_API_KEY;

    expect(() => getEmailEnv()).toThrow(EmailConfigError);
  });

  it("fails closed when the notification address is absent", () => {
    configure();
    delete process.env.CONTACT_NOTIFICATION_EMAIL;

    expect(() => getEmailEnv()).toThrow(/CONTACT_NOTIFICATION_EMAIL/);
  });

  it("refuses an unset sender rather than inventing one", () => {
    configure();
    delete process.env.RESEND_FROM_EMAIL;

    expect(() => getEmailEnv()).toThrow(/RESEND_FROM_EMAIL/);
  });

  it("defaults the reply-to to the notification address", () => {
    configure();

    expect(getEmailEnv().replyToEmail).toBe("owner@example-inbox.com");
  });

  it("honours an explicit reply-to", () => {
    configure({ CONTACT_REPLY_TO_EMAIL: "replies@example-inbox.com" });

    expect(getEmailEnv().replyToEmail).toBe("replies@example-inbox.com");
  });

  it("accepts a bare sender address without a display name", () => {
    configure({ RESEND_FROM_EMAIL: "notifications@ggitech.dev" });

    expect(getEmailEnv().from).toBe("notifications@ggitech.dev");
  });

  it("rejects a sender with no valid address", () => {
    configure({ RESEND_FROM_EMAIL: "GGITECH" });

    expect(() => getEmailEnv()).toThrow(/valid email/);
  });

  it("rejects a display name carrying a CRLF header injection", () => {
    configure({
      RESEND_FROM_EMAIL: "GGITECH\r\nBcc: attacker@example.com <n@ggitech.dev>",
    });

    expect(() => getEmailEnv()).toThrow(/line breaks/);
  });

  it("rejects a notification address carrying a CRLF header injection", () => {
    configure({ CONTACT_NOTIFICATION_EMAIL: "owner@example-inbox.com\nBcc: x@example.com" });

    expect(() => getEmailEnv()).toThrow(/line breaks/);
  });

  it("parses the auto-reply flag as a boolean", () => {
    configure({ CONTACT_AUTO_REPLY_ENABLED: "false" });
    expect(getEmailEnv().autoReplyEnabled).toBe(false);

    configure({ CONTACT_AUTO_REPLY_ENABLED: "TRUE" });
    expect(getEmailEnv().autoReplyEnabled).toBe(true);

    configure({ CONTACT_AUTO_REPLY_ENABLED: "0" });
    expect(getEmailEnv().autoReplyEnabled).toBe(false);
  });

  it("refuses an unparseable auto-reply flag instead of guessing", () => {
    configure({ CONTACT_AUTO_REPLY_ENABLED: "maybe" });

    expect(() => getEmailEnv()).toThrow(EmailConfigError);
  });

  it("treats a blank optional value as unset", () => {
    configure({ CONTACT_REPLY_TO_EMAIL: "   " });

    expect(getEmailEnv().replyToEmail).toBe("owner@example-inbox.com");
  });
});
