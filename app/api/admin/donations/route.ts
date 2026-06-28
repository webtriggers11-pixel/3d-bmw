import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getAdminDonations } from "@/server/admin";
import type { ModerationStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUSES: ModerationStatus[] = ["PENDING", "APPROVED", "REJECTED", "HIDDEN"];

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl;
  const query = url.searchParams.get("query") ?? undefined;
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && STATUSES.includes(statusParam as ModerationStatus)
      ? (statusParam as ModerationStatus)
      : undefined;

  const donations = await getAdminDonations({ query, status });
  return Response.json({ donations });
}
