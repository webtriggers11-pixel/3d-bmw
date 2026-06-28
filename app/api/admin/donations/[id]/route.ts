import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { setModeration, deleteDonation } from "@/server/admin";
import type { ModerationStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUSES: ModerationStatus[] = ["PENDING", "APPROVED", "REJECTED", "HIDDEN"];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  let body: { moderation?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.moderation || !STATUSES.includes(body.moderation as ModerationStatus)) {
    return Response.json({ error: "Invalid moderation status." }, { status: 400 });
  }
  await setModeration(id, body.moderation as ModerationStatus);
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await deleteDonation(id);
  return Response.json({ ok: true });
}
