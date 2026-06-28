import "server-only";
import { redis } from "@/lib/redis";

/**
 * Fixed-window IP rate limit backed by Redis. Returns whether the request is
 * allowed plus the remaining quota in the current window.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; remaining: number }> {
  try {
    const redisKey = `ratelimit:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }
    return { ok: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (err) {
    // Fail OPEN: if Redis is unreachable, don't 500 the route (which would send
    // an empty body and crash the client's res.json()). Allow the request and
    // log — rate limiting is a guard, not a correctness requirement.
    console.error(
      "[rate-limit] Redis unavailable, allowing request:",
      err instanceof Error ? err.message : err,
    );
    return { ok: true, remaining: limit };
  }
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
