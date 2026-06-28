import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  AdminDonation,
  AdminStats,
  ModerationStatus,
} from "@/types";

export interface AdminFilter {
  query?: string;
  status?: ModerationStatus;
}

/** All donations (any state) for the admin table, newest first. */
export async function getAdminDonations(filter: AdminFilter = {}): Promise<AdminDonation[]> {
  const rows = await prisma.donation.findMany({
    where: {
      ...(filter.status ? { moderation: filter.status } : {}),
      ...(filter.query
        ? {
            OR: [
              { name: { contains: filter.query, mode: "insensitive" } },
              { country: { contains: filter.query, mode: "insensitive" } },
              { message: { contains: filter.query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { position: { select: { anchorKey: true } }, car: { select: { index: true } } },
  });

  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    country: d.country,
    message: d.message,
    amount: d.amount,
    currency: d.currency,
    size: d.size,
    moderation: d.moderation,
    paymentStatus: d.paymentStatus,
    anchorKey: d.position.anchorKey,
    carIndex: d.car.index,
    createdAt: d.createdAt.toISOString(),
  }));
}

export async function getAdminStats(): Promise<AdminStats> {
  const paid = { paymentStatus: "PAID" } as const;
  const [agg, countries, grouped] = await Promise.all([
    prisma.donation.aggregate({ where: paid, _sum: { amount: true }, _count: true }),
    prisma.donation.findMany({
      where: { ...paid, country: { not: null } },
      distinct: ["country"],
      select: { country: true },
    }),
    prisma.donation.groupBy({ by: ["moderation"], _count: true }),
  ]);

  const byModeration: AdminStats["byModeration"] = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    HIDDEN: 0,
  };
  for (const g of grouped) byModeration[g.moderation] = g._count;

  return {
    totalRaisedPaise: agg._sum.amount ?? 0,
    paidCount: agg._count,
    contributors: agg._count,
    countries: countries.length,
    byModeration,
  };
}

/** Change a donation's moderation state (hide/approve/reject). Keeps the spot. */
export async function setModeration(
  id: string,
  moderation: ModerationStatus,
): Promise<void> {
  await prisma.$transaction([
    prisma.donation.update({ where: { id }, data: { moderation } }),
    prisma.auditLog.create({
      data: { action: `moderation:${moderation}`, actor: "admin", metadata: { donationId: id } },
    }),
  ]);
}

/** Delete a donation and free its anchor (reopens the car if it was full). */
export async function deleteDonation(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const donation = await tx.donation.findUnique({ where: { id } });
    if (!donation) return;
    await tx.position.update({
      where: { id: donation.positionId },
      data: { occupied: false, reservedUntil: null },
    });
    await tx.donation.delete({ where: { id } });
    await tx.car.update({ where: { id: donation.carId }, data: { status: "ACTIVE" } });
    await tx.auditLog.create({
      data: {
        action: "delete",
        actor: "admin",
        metadata: { donationId: id, name: donation.name },
      },
    });
  });
}

/** CSV of all donations for export. */
export async function donationsCsv(): Promise<string> {
  const rows = await getAdminDonations();
  const header = [
    "id",
    "name",
    "country",
    "message",
    "amount_paise",
    "currency",
    "size",
    "moderation",
    "payment_status",
    "anchor",
    "car_index",
    "created_at",
  ];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((d) =>
    [
      d.id,
      d.name,
      d.country,
      d.message,
      d.amount,
      d.currency,
      d.size,
      d.moderation,
      d.paymentStatus,
      d.anchorKey,
      d.carIndex,
      d.createdAt,
    ]
      .map(escape)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
