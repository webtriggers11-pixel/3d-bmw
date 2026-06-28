import { getCarsWithNames } from "@/server/cars";

// Live data — never cache.
export const dynamic = "force-dynamic";

export async function GET() {
  const cars = await getCarsWithNames();
  return Response.json({ cars });
}
