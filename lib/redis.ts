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
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
