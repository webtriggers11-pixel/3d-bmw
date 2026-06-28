import type { NextRequest } from "next/server";
import { checkCredentials, setSession } from "@/lib/admin-auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Throttle brute-force attempts.
  const rl = await rateLimit(`admin-login:${clientIp(req)}`, 5, 60);
  if (!rl.ok) {
    return Response.json({ error: "Too many attempts." }, { status: 429 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.username || !body.password || !checkCredentials(body.username, body.password)) {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  await setSession(body.username);
  return Response.json({ ok: true });
}
