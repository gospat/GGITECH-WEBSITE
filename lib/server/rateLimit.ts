/**
 * Fixed-window rate limiting behind a pluggable store.
 *
 * The default store lives in this process, which is correct for a single Node
 * process and is bounded in memory. Setting UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN moves the counters into Redis so the limit holds
 * across instances and survives a deploy.
 */

export type RateLimitParams = { key: string; limit: number; windowMs: number };

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export interface RateLimitStore {
  consume(params: RateLimitParams): Promise<RateLimitResult>;
}

/** Hard ceiling on tracked keys so a client cycling IPs cannot grow the map without end. */
const MAX_TRACKED_KEYS = 10_000;

/** How often expired windows are swept out of the default store. */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

function createMemoryStore(): RateLimitStore {
  const windows = new Map<string, { count: number; resetAt: number }>();
  let lastSweep = 0;

  return {
    async consume({ key, limit, windowMs }: RateLimitParams): Promise<RateLimitResult> {
      const now = Date.now();

      if (now - lastSweep >= SWEEP_INTERVAL_MS) {
        lastSweep = now;
        for (const [tracked, window] of windows) {
          if (window.resetAt <= now) windows.delete(tracked);
        }
      }

      const existing = windows.get(key);

      if (!existing || existing.resetAt <= now) {
        // A sweep alone does not bound memory: keys arriving faster than the
        // sweep interval would still accumulate. Evict oldest-first so the
        // ceiling holds under sustained churn.
        while (!existing && windows.size >= MAX_TRACKED_KEYS) {
          const oldest = windows.keys().next();
          if (oldest.done) break;
          windows.delete(oldest.value);
        }

        windows.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true };
      }

      if (existing.count >= limit) {
        return {
          ok: false,
          retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
        };
      }

      existing.count += 1;
      return { ok: true };
    },
  };
}

/**
 * Upstash's REST protocol. INCR, EXPIRE and TTL go out as one pipelined round
 * trip so a request costs a single network hop. Pipeline execution is not
 * atomic, so a burst straddling a boundary can overshoot the limit slightly;
 * that is acceptable for abuse mitigation and avoids needing a Lua script.
 */
function createRedisStore(url: string, token: string): RateLimitStore {
  const endpoint = `${url.replace(/\/+$/, "")}/pipeline`;

  return {
    async consume({ key, limit, windowMs }: RateLimitParams): Promise<RateLimitResult> {
      const seconds = Math.max(1, Math.ceil(windowMs / 1000));
      const namespaced = `ratelimit:${key}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", namespaced],
          ["EXPIRE", namespaced, seconds, "NX"],
          ["TTL", namespaced],
        ]),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`rate limit store responded ${response.status}`);
      }

      const payload = (await response.json()) as Array<{ result?: number | string }>;
      const count = Number(payload?.[0]?.result ?? 0);
      const ttl = Number(payload?.[2]?.result ?? seconds);

      if (!Number.isFinite(count) || count <= 0) {
        throw new Error("rate limit store returned an unusable counter");
      }

      if (count > limit) {
        return { ok: false, retryAfterSeconds: Math.max(1, Number.isFinite(ttl) ? ttl : seconds) };
      }

      return { ok: true };
    },
  };
}

let configuredStore: RateLimitStore | null = null;
const fallbackStore = createMemoryStore();
let hasWarnedAboutFallback = false;

function selectStore(): RateLimitStore {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) return createRedisStore(url, token);
  return createMemoryStore();
}

export async function rateLimit(params: RateLimitParams): Promise<RateLimitResult> {
  configuredStore ??= selectStore();

  try {
    return await configuredStore.consume(params);
  } catch (error) {
    // Losing the limiter must not take the endpoint down, so protection
    // degrades to per-process counters instead of disappearing. Config
    // mistakes stay visible because the first failure is logged.
    if (!hasWarnedAboutFallback) {
      hasWarnedAboutFallback = true;
      console.error(
        "rateLimit: shared store unavailable, falling back to in-process counters",
        error
      );
    }
    return fallbackStore.consume(params);
  }
}
