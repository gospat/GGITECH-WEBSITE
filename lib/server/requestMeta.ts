import type { NextRequest } from "next/server";

export function getRequestIp(req: NextRequest): string | undefined {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || undefined;
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return undefined;
}

export function getUserAgent(req: NextRequest): string | undefined {
  const ua = req.headers.get("user-agent");
  return ua ? ua.slice(0, 300) : undefined;
}
