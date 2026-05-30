type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(params.key) ?? { timestamps: [] };
  const cutoff = now - params.windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= params.limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterMs = Math.max(0, params.windowMs - (now - oldest));
    buckets.set(params.key, bucket);
    return { ok: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }

  bucket.timestamps.push(now);
  buckets.set(params.key, bucket);
  return { ok: true };
}

