import { isAdmin } from "@/lib/admin-auth";
import { donationsCsv } from "@/server/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const csv = await donationsCsv();
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="donations.csv"',
    },
  });
}
