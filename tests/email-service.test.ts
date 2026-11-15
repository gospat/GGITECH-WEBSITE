import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ContactMessage } from "@/lib/contactMessage";
import { buildContactEnquiry } from "@/lib/server/email/enquiry";
import { EmailConfigError, EmailDeliveryError } from "@/lib/server/email/errors";
import { sendEnquiryEmails } from "@/lib/server/email/service";

/**
 * The Resend SDK and the React Email renderer are both replaced rather than
 * configured: no test in this file can reach the network, and none depends on
 * the templates' internals. Rendering is covered by its own test file.
 */
const { sendMock, renderMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  renderMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    readonly emails = { send: sendMock };
  },
}));

vi.mock("@react-email/render", () => ({ render: renderMock }));

const HTML_STUB = "<!DOCTYPE html><html><body>STUB</body></html>";
const TEXT_STUB = "STUB PLAIN TEXT";

const KEYS = [
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "CONTACT_NOTIFICATION_EMAIL",
  "CONTACT_REPLY_TO_EMAIL",
  "CONTACT_AUTO_REPLY_ENABLED",
] as const;

const before = new Map<string, string | undefined>();

const MESSAGE: ContactMessage = {
  name: "Adaeze Okafor-Testcase",
  email: "adaeze@example.com",
  company: "Northwind Testcase Ltd",
  message: "We would like to discuss a new marketing site for our logistics business.",
};

const REFERENCE = "GGI-261115-7QK4ZP";
const SUBMITTED_AT = new Date("2026-11-15T14:32:00Z");

function accepted(id = "msg_123") {
  return { data: { id }, error: null, headers: {} };
}

function refused(name: string) {
  return { data: null, error: { name, message: "provider says no", statusCode: 422 }, headers: {} };
}

function enquiry() {
  return buildContactEnquiry({ message: MESSAGE, reference: REFERENCE, submittedAt: SUBMITTED_AT });
}

function configure(overrides: Record<string, string | undefined> = {}): void {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "GGITECH <notifications@ggitech.dev>";
  process.env.CONTACT_NOTIFICATION_EMAIL = "owner@example-inbox.com";
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

beforeEach(() => {
  for (const key of KEYS) before.set(key, process.env[key]);
  configure();
  sendMock.mockReset();
  sendMock.mockResolvedValue(accepted());
  renderMock.mockReset();
  renderMock.mockImplementation(async (_element: unknown, options?: { plainText?: boolean }) =>
    options?.plainText ? TEXT_STUB : HTML_STUB
  );
});

afterEach(() => {
  for (const key of KEYS) {
    const value = before.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("sendEnquiryEmails", () => {
  it("sends the notification to the configured address, then the acknowledgement", async () => {
    sendMock.mockResolvedValueOnce(accepted("msg_notification"));
    sendMock.mockResolvedValueOnce(accepted("msg_acknowledgement"));

    const result = await sendEnquiryEmails({ enquiry: enquiry() });

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      reference: REFERENCE,
      notificationMessageId: "msg_notification",
      acknowledgement: "sent",
    });
  });

  it("addresses the notification to the server-side recipient, never a form field", async () => {
    await sendEnquiryEmails({ enquiry: enquiry() });

    const [payload] = sendMock.mock.calls[0];
    expect(payload.to).toBe("owner@example-inbox.com");
    expect(payload.from).toBe("GGITECH <notifications@ggitech.dev>");
    // Untrusted addresses may only ever appear as reply-to.
    expect(payload.replyTo).toBe(MESSAGE.email);
  });

  it("routes acknowledgement replies back to the team, not the customer", async () => {
    configure({ CONTACT_REPLY_TO_EMAIL: "replies@example-inbox.com" });

    await sendEnquiryEmails({ enquiry: enquiry() });

    const [ackPayload] = sendMock.mock.calls[1];
    expect(ackPayload.to).toBe(MESSAGE.email);
    expect(ackPayload.replyTo).toBe("replies@example-inbox.com");
  });

  it("uses the required subject formats", async () => {
    await sendEnquiryEmails({ enquiry: enquiry() });

    expect(sendMock.mock.calls[0][0].subject).toBe(
      "[GGITECH] New Project Enquiry — Adaeze Okafor-Testcase"
    );
    expect(sendMock.mock.calls[1][0].subject).toBe("We've received your enquiry | GGITECH");
  });

  it("sends the rendered HTML with a plain-text alternative on every message", async () => {
    await sendEnquiryEmails({ enquiry: enquiry() });

    for (const [payload] of sendMock.mock.calls) {
      expect(payload.html).toBe(HTML_STUB);
      expect(payload.text).toBe(TEXT_STUB);
    }
  });

  it("carries an idempotency key and a request deadline", async () => {
    await sendEnquiryEmails({ enquiry: enquiry() });

    const [, options] = sendMock.mock.calls[0];
    expect(typeof options.idempotencyKey).toBe("string");
    expect(options.idempotencyKey.length).toBeGreaterThan(0);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("attaches the project brief PDF to the notification only", async () => {
    const attachment = {
      filename: "project-brief-example.pdf",
      content: new Uint8Array([37, 80, 68, 70]),
      contentType: "application/pdf",
    };

    await sendEnquiryEmails({ enquiry: enquiry(), attachments: [attachment] });

    expect(sendMock.mock.calls[0][0].attachments).toEqual([attachment]);
    expect(sendMock.mock.calls[1][0].attachments).toBeUndefined();
  });

  it("fails when the notification is refused, and sends no acknowledgement", async () => {
    sendMock.mockResolvedValueOnce(refused("invalid_from_address"));

    await expect(sendEnquiryEmails({ enquiry: enquiry() })).rejects.toBeInstanceOf(
      EmailDeliveryError
    );
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces the provider code for the log without putting it in the message", async () => {
    sendMock.mockResolvedValueOnce(refused("daily_quota_exceeded"));

    const error = await sendEnquiryEmails({ enquiry: enquiry() }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EmailDeliveryError);
    expect((error as EmailDeliveryError).providerCode).toBe("daily_quota_exceeded");
    expect((error as EmailDeliveryError).message).not.toContain("daily_quota_exceeded");
  });

  it("treats a provider timeout as a delivery failure, not a success", async () => {
    const timeout = Object.assign(new Error("The operation was aborted"), { name: "TimeoutError" });
    sendMock.mockRejectedValueOnce(timeout);

    const error = await sendEnquiryEmails({ enquiry: enquiry() }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EmailDeliveryError);
    expect((error as EmailDeliveryError).providerCode).toBe("timeout");
  });

  it("treats an unreachable provider as a delivery failure", async () => {
    sendMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const error = await sendEnquiryEmails({ enquiry: enquiry() }).catch((e: unknown) => e);

    expect((error as EmailDeliveryError).providerCode).toBe("network_error");
  });

  it("still reports success for the enquiry when the acknowledgement fails", async () => {
    sendMock.mockResolvedValueOnce(accepted("msg_notification"));
    sendMock.mockRejectedValueOnce(new Error("acknowledgement exploded"));

    const result = await sendEnquiryEmails({ enquiry: enquiry() });

    expect(result.notificationMessageId).toBe("msg_notification");
    expect(result.acknowledgement).toBe("failed");
  });

  it("skips the acknowledgement when auto-reply is disabled", async () => {
    configure({ CONTACT_AUTO_REPLY_ENABLED: "false" });

    const result = await sendEnquiryEmails({ enquiry: enquiry() });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(result.acknowledgement).toBe("skipped");
  });

  it("fails before contacting the provider when configuration is missing", async () => {
    delete process.env.RESEND_API_KEY;

    await expect(sendEnquiryEmails({ enquiry: enquiry() })).rejects.toBeInstanceOf(
      EmailConfigError
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("logs an accepted submission with its reference and provider id", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await sendEnquiryEmails({ enquiry: enquiry() });

    const events = info.mock.calls.map(
      ([line]) => JSON.parse(String(line)) as Record<string, unknown>
    );
    expect(events.some((e) => e.event === "enquiry.notification_accepted")).toBe(true);
    expect(events.some((e) => e.event === "enquiry.acknowledgement_accepted")).toBe(true);
    expect(events.every((e) => e.reference === REFERENCE)).toBe(true);
  });

  it("never logs the API key, the customer address or the message body", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await sendEnquiryEmails({ enquiry: enquiry() });
    sendMock.mockReset();
    sendMock.mockResolvedValueOnce(refused("validation_error"));
    await sendEnquiryEmails({ enquiry: enquiry() }).catch(() => {});

    const lines = [...info.mock.calls, ...error.mock.calls]
      .map(([line]) => String(line))
      .join("\n");

    expect(lines).not.toContain("re_test_key");
    expect(lines).not.toContain(MESSAGE.email);
    expect(lines).not.toContain(MESSAGE.message);
    expect(lines).not.toContain("owner@example-inbox.com");
  });

  it("normalises a non-provider rejection and never logs the raw value", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMock.mockRejectedValueOnce("not even an Error");

    await expect(sendEnquiryEmails({ enquiry: enquiry() })).rejects.toBeInstanceOf(
      EmailDeliveryError
    );

    const logged = error.mock.calls.map(([line]) => String(line)).join("\n");
    expect(logged).toContain("enquiry.notification_failed");
    expect(logged).toContain("network_error");
    expect(logged).not.toContain("not even an Error");
  });

  it("reports a rendering failure as an unexpected error and sends nothing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    renderMock.mockRejectedValueOnce(new Error("template blew up"));

    await expect(sendEnquiryEmails({ enquiry: enquiry() })).rejects.toThrow("template blew up");

    const logged = error.mock.calls.map(([line]) => String(line)).join("\n");
    expect(logged).toContain("enquiry.notification_failed");
    expect(logged).toContain("unexpected_error");
    expect(sendMock).not.toHaveBeenCalled();
  });
});
