import Redis from "ioredis";
import { env } from "@/lib/env";

/**
 * Single ioredis connection, reused across hot-reloads in development.
 * Used for IP rate limiting, position reservation locks, and duplicate
 * payment detection.
 */
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    // Reject commands immediately when disconnected instead of buffering them,
    // so callers (e.g. rateLimit) fail fast and can degrade gracefully rather
    // than hanging or throwing late.
    enableOfflineQueue: false,
    lazyConnect: false,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

// Without an 'error' listener ioredis logs "Unhandled error event" on every
// failed connection attempt. Swallow-and-log here; individual commands still
// reject, and callers handle that (rate-limit fails open, etc.).
redis.on("error", (err: Error) => {
  console.error("[redis] connection error:", err?.message ?? err);
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
