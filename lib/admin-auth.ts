import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const COOKIE = "admin_session";
const SECRET = env.ADMIN_PASSWORD || "dev-admin-secret";

function sign(username: string): string {
  const mac = crypto.createHmac("sha256", SECRET).update(username).digest("hex");
  return `${username}.${mac}`;
}

function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return false;
  const username = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(username).digest("hex");
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Validate admin login credentials against env. */
export function checkCredentials(username: string, password: string): boolean {
  return username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD;
}

export async function setSession(username: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, sign(username), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/**
 * Whether the current request may use the admin panel.
 * When AUTH_ENABLED=false the admin is open (dev convenience, per spec).
 * When AUTH_ENABLED=true a valid signed session cookie is required.
 */
export async function isAdmin(): Promise<boolean> {
  if (!env.AUTH_ENABLED) return true;
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}

/** True when a login step is actually required (auth enabled). */
export const authRequired = env.AUTH_ENABLED;
