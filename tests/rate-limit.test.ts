import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { rateLimit } from "@/lib/server/rateLimit";
import { getRequestIp, getUserAgent, isSameOriginRequest } from "@/lib/server/requestMeta";

/**
 * Minimal stand-in for `NextRequest`. Building a real one would pull the Next
 * server runtime into a unit test for two header reads.
 */
function request(url: string, headers: Record<string, string> = {}) {
  const normalised = new Headers(
    Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))
  );

  return {
    headers: normalised,
    nextUrl: new URL(url),
  } as unknown as Parameters<typeof getRequestIp>[0];
}

describe("getRequestIp", () => {
  const before = process.env.TRUSTED_PROXY_HOPS;

  beforeEach(() => {
    delete process.env.TRUSTED_PROXY_HOPS;
  });

  afterEach(() => {
    if (before === undefined) delete process.env.TRUSTED_PROXY_HOPS;
    else process.env.TRUSTED_PROXY_HOPS = before;
  });

  it("takes the address the trusted proxy appended, not the client's claim", () => {
    // A client that sends its own x-forwarded-for arrives at nginx with that
    // value already in the chain; nginx then appends the address it actually
    // saw. With one trusted hop the last entry is the real client.
    const ip = getRequestIp(
      request("https://ggitech.dev/api/contact", {
        "x-forwarded-for": "9.9.9.9, 203.0.113.7",
      })
    );

    expect(ip).toBe("203.0.113.7");
  });

  it("cannot be handed a fresh identity by adding entries to the left", () => {
    const forged = getRequestIp(
      request("https://ggitech.dev/api/contact", {
        "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3, 198.51.100.9",
      })
    );

    expect(forged).toBe("198.51.100.9");
  });

  it("walks back further when more proxies are declared trusted", () => {
    process.env.TRUSTED_PROXY_HOPS = "2";

    const ip = getRequestIp(
      request("https://ggitech.dev/api/contact", {
        "x-forwarded-for": "9.9.9.9, 203.0.113.7, 10.0.0.1",
      })
    );

    expect(ip).toBe("203.0.113.7");
  });

  it("returns no address at all when nothing in front of the app is trusted", () => {
    process.env.TRUSTED_PROXY_HOPS = "0";

    const ip = getRequestIp(
      request("https://ggitech.dev/api/contact", {
        "x-forwarded-for": "203.0.113.7",
        "x-real-ip": "203.0.113.7",
      })
    );

    expect(ip).toBeUndefined();
  });

  it("falls back to x-real-ip when no forwarded chain is present", () => {
    const ip = getRequestIp(
      request("https://ggitech.dev/api/contact", { "x-real-ip": "203.0.113.7" })
    );

    expect(ip).toBe("203.0.113.7");
  });

  it("returns undefined when the chain is shorter than the trusted hop count", () => {
    process.env.TRUSTED_PROXY_HOPS = "3";

    const ip = getRequestIp(
      request("https://ggitech.dev/api/contact", { "x-forwarded-for": "203.0.113.7" })
    );

    expect(ip).toBeUndefined();
  });

  it("falls back to the default when the hop count is unparseable", () => {
    process.env.TRUSTED_PROXY_HOPS = "not-a-number";

    const ip = getRequestIp(
      request("https://ggitech.dev/api/contact", { "x-forwarded-for": "203.0.113.7" })
    );

    expect(ip).toBe("203.0.113.7");
  });
});

describe("getUserAgent", () => {
  it("caps the value so a huge header cannot bloat a log line", () => {
    const ua = getUserAgent(
      request("https://ggitech.dev/api/contact", { "user-agent": "x".repeat(5_000) })
    );

    expect(ua?.length).toBe(300);
  });

  it("returns undefined when absent", () => {
    expect(getUserAgent(request("https://ggitech.dev/api/contact"))).toBeUndefined();
  });
});

describe("isSameOriginRequest", () => {
  it("rejects a cross-site browser request", () => {
    const allowed = isSameOriginRequest(
      request("https://ggitech.dev/api/contact", { "sec-fetch-site": "cross-site" })
    );

    expect(allowed).toBe(false);
  });

  it("allows a same-origin browser request", () => {
    const allowed = isSameOriginRequest(
      request("https://ggitech.dev/api/contact", { "sec-fetch-site": "same-origin" })
    );

    expect(allowed).toBe(true);
  });

  it("falls back to the Origin header when sec-fetch-site is absent", () => {
    expect(
      isSameOriginRequest(
        request("https://ggitech.dev/api/contact", { origin: "https://ggitech.dev" })
      )
    ).toBe(true);
    expect(
      isSameOriginRequest(
        request("https://ggitech.dev/api/contact", { origin: "https://attacker.example" })
      )
    ).toBe(false);
  });

  it("allows a header-less caller, which no browser can produce", () => {
    expect(isSameOriginRequest(request("https://ggitech.dev/api/contact"))).toBe(true);
  });
});

describe("rateLimit", () => {
  const beforeUrl = process.env.UPSTASH_REDIS_REST_URL;
  const beforeToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    // Force the in-process store so no test can reach the network.
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    if (beforeUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = beforeUrl;
    if (beforeToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = beforeToken;
  });

  it("allows requests up to the limit and refuses the one after", async () => {
    const key = `test:${Math.random()}`;
    const params = { key, limit: 2, windowMs: 60_000 };

    expect((await rateLimit(params)).ok).toBe(true);
    expect((await rateLimit(params)).ok).toBe(true);

    const refused = await rateLimit(params);
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("counts each key independently", async () => {
    const params = { limit: 1, windowMs: 60_000 };

    expect((await rateLimit({ ...params, key: `a:${Math.random()}` })).ok).toBe(true);
    expect((await rateLimit({ ...params, key: `b:${Math.random()}` })).ok).toBe(true);
  });

  it("treats an expired window as a fresh one", async () => {
    const key = `test:${Math.random()}`;

    expect((await rateLimit({ key, limit: 1, windowMs: 1 })).ok).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect((await rateLimit({ key, limit: 1, windowMs: 1 })).ok).toBe(true);
  });
});
