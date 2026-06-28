import { getLeaderboard } from "@/server/donations";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getLeaderboard();
  return Response.json(data);
}
