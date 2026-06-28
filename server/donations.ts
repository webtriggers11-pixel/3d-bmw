import "server-only";
import { prisma } from "@/lib/prisma";
import type { NameSize } from "@/types";

export interface LeaderEntry {
  id: string;
  name: string;
  country: string | null;
  amount: number; // paise
  size: NameSize;
  createdAt: string;
}

const PUBLIC_WHERE = { paymentStatus: "PAID", moderation: "APPROVED" } as const;
const SELECT = {
  id: true,
  name: true,
  country: true,
  amount: true,
  size: true,
  createdAt: true,
} as const;

/** Top contributors (by amount) and most recent contributors. */
export async function getLeaderboard(): Promise<{
  top: LeaderEntry[];
  recent: LeaderEntry[];
}> {
  const [top, recent] = await Promise.all([
    prisma.donation.findMany({
      where: PUBLIC_WHERE,
      orderBy: { amount: "desc" },
      take: 10,
      select: SELECT,
    }),
    prisma.donation.findMany({
      where: PUBLIC_WHERE,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: SELECT,
    }),
  ]);

  const map = (d: (typeof top)[number]): LeaderEntry => ({
    id: d.id,
    name: d.name,
    country: d.country,
    amount: d.amount,
    size: d.size,
    createdAt: d.createdAt.toISOString(),
  });

  return { top: top.map(map), recent: recent.map(map) };
}

/** Aggregate stats for the homepage. */
export async function getStats() {
  const agg = await prisma.donation.aggregate({
    where: PUBLIC_WHERE,
    _sum: { amount: true },
    _count: true,
  });
  const countries = await prisma.donation.findMany({
    where: { ...PUBLIC_WHERE, country: { not: null } },
    distinct: ["country"],
    select: { country: true },
  });
  return {
    totalRaisedPaise: agg._sum.amount ?? 0,
    contributors: agg._count,
    countries: countries.length,
  };
}
