import type { NextRequest } from "next/server";
import { siteUrl } from "@/lib/site";

/**
 * How many reverse proxies sit in front of the app and are trusted to append
 * to `x-forwarded-for`. Clients can send that header themselves, so an entry
 * only becomes trustworthy after walking back past the proxies we control.
 * A single proxy (nginx, a load balancer, a CDN) is the common case.
 */
const DEFAULT_TRUSTED_PROXY_HOPS = 1;

function trustedProxyHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS?.trim();
  if (!raw) return DEFAULT_TRUSTED_PROXY_HOPS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_TRUSTED_PROXY_HOPS;
}

export function getRequestIp(req: NextRequest): string | undefined {
  const hops = trustedProxyHops();

  // Nothing in front of us means every address the client reports is
  // unverifiable, so no IP is returned rather than a spoofable one.
  if (hops === 0) return undefined;

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const chain = forwardedFor
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    // Each hop appends the address it received the connection from, so the
    // rightmost entry was written by the proxy nearest us. Counting back
    // `hops` places lands on the client our outermost trusted proxy saw.
    const position = chain.length - hops;
    const candidate = position >= 0 ? chain[position] : undefined;
    if (candidate) return candidate;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return undefined;
}

export function getUserAgent(req: NextRequest): string | undefined {
  const ua = req.headers.get("user-agent");
  return ua ? ua.slice(0, 300) : undefined;
}

/**
 * Rejects POSTs that a third-party page triggered. Browsers always send
 * `sec-fetch-site` and it is a forbidden header, so page scripts cannot forge
 * it. Requests carrying neither header (CLI tools, server-to-server callers)
 * are allowed through because they are not subject to browser cross-site
 * attacks.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite !== "cross-site";

  const origin = req.headers.get("origin");
  if (!origin) return true;

  return origin === req.nextUrl.origin || origin === siteUrl;
}
