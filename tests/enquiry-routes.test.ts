import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * End-to-end tests for the two enquiry endpoints.
 *
 * These drive the real route handlers — real validation, real reference
 * generation, real rate limiting, the real duplicate-submission guard, the real
 * template rendering pipeline (stubbed) and the real PDF builder — with only
 * the Resend SDK and the React Email renderer replaced. That is the layer where
 * "did the visitor get told the truth?" is actually decided, so it is tested
 * against the same three configuration states a deployment can be in: missing,
 * invalid, and valid.
 *
 * Nothing here can reach the network, and no real key is ever read.
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

/** Every variable that can make the email layer succeed, fail, or be absent. */
const EMAIL_KEYS = [
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "CONTACT_NOTIFICATION_EMAIL",
  "CONTACT_REPLY_TO_EMAIL",
  "CONTACT_AUTO_REPLY_ENABLED",
] as const;

/** Read at module load by `lib/site.ts`, so tests that vary it reload modules. */
const PUBLIC_KEYS = ["NEXT_PUBLIC_CONTACT_EMAIL", "TRUSTED_PROXY_HOPS"] as const;

const originalEnv = new Map<string, string | undefined>();
for (const key of [...EMAIL_KEYS, ...PUBLIC_KEYS]) {
  originalEnv.set(key, process.env[key]);
}

const OWNER_INBOX = "owner@example-inbox.com";

function accepted(id = "msg_accepted") {
  return { data: { id }, error: null, headers: {} };
}

function refused(name: string) {
  return { data: null, error: { name, message: "provider says no", statusCode: 422 }, headers: {} };
}

function clearEmailEnv(): void {
  for (const key of EMAIL_KEYS) delete process.env[key];
}

/** A complete, valid configuration: the state a correct deployment is in. */
function validConfig(overrides: Record<string, string> = {}): void {
  clearEmailEnv();
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "GGITECH <notifications@ggitech.dev>";
  process.env.CONTACT_NOTIFICATION_EMAIL = OWNER_INBOX;
  for (const [key, value] of Object.entries(overrides)) process.env[key] = value;
}

/** A fresh module graph: new rate-limit counters, new guard, re-read `contactEmail`. */
async function loadRoutes() {
  vi.resetModules();
  const contact = await import("@/app/api/contact/route");
  const brief = await import("@/app/api/project-brief/route");
  return { contact: contact.POST, brief: brief.POST };
}

let ipCounter = 0;

/**
 * Each request gets its own client IP so one test's rate-limit consumption
 * cannot refuse the next test's request.
 */
function nextIp(): string {
  ipCounter += 1;
  return `198.51.${Math.floor(ipCounter / 250) % 250}.${(ipCounter % 250) + 1}`;
}

function post(path: string, payload: unknown, options: { raw?: string } = {}): NextRequest {
  return new NextRequest(`https://ggitech.dev${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "sec-fetch-site": "same-origin",
      "user-agent": "vitest",
      "x-forwarded-for": nextIp(),
    },
    body: options.raw ?? JSON.stringify(payload),
  });
}

async function body(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

/** Unique per call so the duplicate-submission guard never sees a replay. */
let seed = 0;
function contactPayload() {
  seed += 1;
  return {
    name: `Adaeze Okafor-Testcase ${seed}`,
    email: "adaeze@example.com",
    company: "Northwind Testcase Ltd",
    message: `Enquiry number ${seed}: we need a new marketing site for our logistics business.`,
  };
}

function briefPayload() {
  seed += 1;
  return {
    contact: {
      clientName: `Tunde Example ${seed}`,
      email: "tunde@example.com",
      phone: "+234 801 234 5678",
      preferredContactMethod: "email",
      companyWebsite: "",
    },
    business: {
      businessName: `Northwind Testcase Ltd ${seed}`,
      businessDescription: "Freight forwarding between Lagos and Abuja.",
      targetAudience: "",
      location: "Lagos",
    },
    goals: { mainPurpose: "A tracking dashboard.", desiredUserActions: "" },
    features: { contactForm: true, other: "" },
    pagesRequired: "Home\nContact",
    design: {
      colorScheme: "",
      hasLogo: "yes",
      referenceWebsites: [],
      preferredStyle: "",
      accessibilityStyle: "",
      accessibilityPriority: "yes",
    },
    content: { provideText: "yes", provideMedia: "no", needContentHelp: "no" },
    domainHosting: { hasDomain: "no", domainDetails: "", needHostingHelp: "yes" },
    timeline: "",
    budget: "",
    additionalNotes: "",
    consent: true,
  };
}

beforeEach(() => {
  validConfig();
  delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  delete process.env.TRUSTED_PROXY_HOPS;
  sendMock.mockReset();
  sendMock.mockResolvedValue(accepted());
  renderMock.mockReset();
  renderMock.mockImplementation(async (_element: unknown, options?: { plainText?: boolean }) =>
    options?.plainText ? TEXT_STUB : HTML_STUB
  );
});

afterAll(() => {
  for (const [key, value] of originalEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("both forms when the email configuration is missing", () => {
  it("answers 503 for the contact form and sends nothing", async () => {
    clearEmailEnv();
    const { contact } = await loadRoutes();

    const res = await contact(post("/api/contact", contactPayload()));

    expect(res.status).toBe(503);
    expect((await body(res)).ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("answers 503 for the project brief and sends nothing", async () => {
    clearEmailEnv();
    const { brief } = await loadRoutes();

    const res = await brief(post("/api/project-brief", briefPayload()));

    expect(res.status).toBe(503);
    expect((await body(res)).ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("names no address, because none has been published", async () => {
    clearEmailEnv();
    const { contact } = await loadRoutes();

    const message = String(
      (await body(await contact(post("/api/contact", contactPayload())))).error
    );

    // A visitor told to write to a mailbox that may not exist has nowhere left
    // to go, so with nothing configured the message must name no address.
    expect(message).not.toMatch(/[\w.+-]+@[\w.-]+\.\w+/);
    expect(message).toMatch(/try again/i);
  });

  it("does not leak which variable is missing, or the notification address", async () => {
    clearEmailEnv();
    const { contact } = await loadRoutes();

    const bodyText = JSON.stringify(
      await body(await contact(post("/api/contact", contactPayload())))
    );

    expect(bodyText).not.toContain("RESEND");
    expect(bodyText).not.toContain("CONTACT_NOTIFICATION_EMAIL");
    expect(bodyText).not.toContain(OWNER_INBOX);
  });

  it("publishes the fallback address only once one is configured", async () => {
    clearEmailEnv();
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "hello@ggitech.dev";
    const { contact } = await loadRoutes();

    const message = String(
      (await body(await contact(post("/api/contact", contactPayload())))).error
    );

    expect(message).toContain("hello@ggitech.dev");
  });

  it("ignores a malformed published address rather than printing it", async () => {
    clearEmailEnv();
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "not-an-address";
    const { contact } = await loadRoutes();

    const message = String(
      (await body(await contact(post("/api/contact", contactPayload())))).error
    );

    expect(message).not.toContain("not-an-address");
    expect(message).toMatch(/try again/i);
  });
});

describe("both forms when the email configuration is invalid", () => {
  it("answers 503 when the sender is not an address", async () => {
    validConfig({ RESEND_FROM_EMAIL: "ggitech.dev" });
    const { contact, brief } = await loadRoutes();

    expect((await contact(post("/api/contact", contactPayload()))).status).toBe(503);
    expect((await brief(post("/api/project-brief", briefPayload()))).status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("answers 503 when the notification address is not an address", async () => {
    validConfig({ CONTACT_NOTIFICATION_EMAIL: "owner@" });
    const { contact } = await loadRoutes();

    expect((await contact(post("/api/contact", contactPayload()))).status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("answers 503 when the reply-to address is not an address", async () => {
    validConfig({ CONTACT_REPLY_TO_EMAIL: "nope" });
    const { contact } = await loadRoutes();

    expect((await contact(post("/api/contact", contactPayload()))).status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("answers 503 when a header-bound value carries a line break", async () => {
    validConfig({
      RESEND_FROM_EMAIL: "GGITECH <notifications@ggitech.dev>\r\nBcc: attacker@example.com",
    });
    const { contact } = await loadRoutes();

    expect((await contact(post("/api/contact", contactPayload()))).status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("answers 503 when the auto-reply flag is not a boolean", async () => {
    validConfig({ CONTACT_AUTO_REPLY_ENABLED: "maybe" });
    const { contact } = await loadRoutes();

    expect((await contact(post("/api/contact", contactPayload()))).status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("both forms when the email configuration is valid", () => {
  it("accepts a contact enquiry and returns a reference", async () => {
    const { contact } = await loadRoutes();

    const res = await contact(post("/api/contact", contactPayload()));
    const payload = await body(res);

    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(String(payload.reference)).toMatch(/^GGI-\d{6}-[0-9A-Z]{6}$/);
    expect(payload.acknowledged).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("addresses the notification from the server config, never from the form", async () => {
    const { contact } = await loadRoutes();

    await contact(post("/api/contact", contactPayload()));

    const [notification] = sendMock.mock.calls[0];
    expect(notification.to).toBe(OWNER_INBOX);
    expect(notification.replyTo).toBe("adaeze@example.com");
    expect(notification.subject).toContain("[GGITECH]");
    expect(notification.html).toBe(HTML_STUB);
    expect(notification.text).toBe(TEXT_STUB);
  });

  it("accepts a project brief and attaches the PDF to the notification only", async () => {
    const { brief } = await loadRoutes();

    const res = await brief(post("/api/project-brief", briefPayload()));
    const payload = await body(res);

    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(2);

    const [notification] = sendMock.mock.calls[0];
    const [acknowledgement] = sendMock.mock.calls[1];
    expect(notification.attachments).toHaveLength(1);
    expect(notification.attachments[0].contentType).toBe("application/pdf");
    expect(notification.attachments[0].filename).toMatch(/^project-brief-.*\.pdf$/);
    expect(acknowledgement.attachments).toBeUndefined();
  });

  it("reports no acknowledgement when the auto-reply is switched off", async () => {
    validConfig({ CONTACT_AUTO_REPLY_ENABLED: "false" });
    const { contact } = await loadRoutes();

    const payload = await body(await contact(post("/api/contact", contactPayload())));

    expect(payload.ok).toBe(true);
    expect(payload.acknowledged).toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});

describe("success is only reported after Resend accepts the notification", () => {
  it("does not settle until the provider has answered", async () => {
    const { contact } = await loadRoutes();

    let release: (value: unknown) => void = () => {};
    sendMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );

    let settled = false;
    const pending = contact(post("/api/contact", contactPayload())).then((res) => {
      settled = true;
      return res;
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(settled).toBe(false);

    release(accepted());
    expect((await pending).status).toBe(200);
  });

  it("answers 502 and no reference when the provider refuses the notification", async () => {
    sendMock.mockResolvedValueOnce(refused("daily_quota_exceeded"));
    const { contact } = await loadRoutes();

    const res = await contact(post("/api/contact", contactPayload()));
    const payload = await body(res);

    expect(res.status).toBe(502);
    expect(payload.ok).toBe(false);
    expect(payload.reference).toBeUndefined();
    // The acknowledgement must not be attempted when the team's copy failed.
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("answers 502 when the provider call rejects outright", async () => {
    sendMock.mockRejectedValueOnce(new Error("socket hang up"));
    const { brief } = await loadRoutes();

    const res = await brief(post("/api/project-brief", briefPayload()));

    expect(res.status).toBe(502);
    expect((await body(res)).ok).toBe(false);
  });

  it("does not echo the provider's own message to the visitor", async () => {
    sendMock.mockResolvedValueOnce(refused("validation_error"));
    const { contact } = await loadRoutes();

    const payload = await body(await contact(post("/api/contact", contactPayload())));

    expect(String(payload.error)).not.toContain("provider says no");
    expect(String(payload.error)).not.toContain("validation_error");
  });

  it("keeps a failed submission retryable", async () => {
    sendMock.mockResolvedValueOnce(refused("internal_server_error"));
    const { contact } = await loadRoutes();
    const payload = contactPayload();

    const first = await contact(post("/api/contact", payload));
    expect(first.status).toBe(502);

    const second = await contact(post("/api/contact", payload));

    // Nothing was recorded on failure, so the corrected retry is sent again
    // rather than being answered as a duplicate.
    expect(second.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(3);
  });

  it("answers a replayed submission with the original reference, without resending", async () => {
    const { contact } = await loadRoutes();
    const payload = contactPayload();

    const first = await body(await contact(post("/api/contact", payload)));
    const second = await body(await contact(post("/api/contact", payload)));

    expect(second.ok).toBe(true);
    expect(second.reference).toBe(first.reference);
    // One notification plus one acknowledgement, not four sends.
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});

describe("requests are rejected before any email quota is spent", () => {
  it("answers 400 and sends nothing for an invalid submission", async () => {
    const { contact } = await loadRoutes();

    const res = await contact(post("/api/contact", { ...contactPayload(), email: "adaeze@" }));

    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("answers 403 and sends nothing for a cross-site request", async () => {
    const { contact } = await loadRoutes();
    const req = new NextRequest("https://ggitech.dev/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "sec-fetch-site": "cross-site",
        "x-forwarded-for": nextIp(),
      },
      body: JSON.stringify(contactPayload()),
    });

    expect((await contact(req)).status).toBe(403);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("answers a filled honeypot with success without sending", async () => {
    const { contact } = await loadRoutes();

    const res = await contact(
      post("/api/contact", { ...contactPayload(), companyWebsite: "http://spam.example" })
    );

    expect(res.status).toBe(200);
    expect((await body(res)).ok).toBe(true);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("answers 400 and sends nothing for a malformed JSON body", async () => {
    const { contact } = await loadRoutes();

    const res = await contact(post("/api/contact", null, { raw: "{not json" }));

    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
