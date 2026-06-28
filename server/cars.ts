import "server-only";
import { prisma } from "@/lib/prisma";
import { SIZE_SCALE } from "@/lib/sizing";
import type { CarView, PlacedName, Vec3 } from "@/types";

/**
 * Load every car with the names currently displayed on it. Only PAID donations
 * that pass moderation (APPROVED) are shown publicly.
 */
export async function getCarsWithNames(): Promise<CarView[]> {
  const cars = await prisma.car.findMany({
    orderBy: { index: "asc" },
    include: {
      positions: {
        include: { donation: true },
        orderBy: { anchorKey: "asc" },
      },
    },
  });

  return cars.map((car): CarView => {
    const names: PlacedName[] = [];
    for (const pos of car.positions) {
      const d = pos.donation;
      if (!d) continue;
      if (d.paymentStatus !== "PAID" || d.moderation !== "APPROVED") continue;
      names.push({
        id: d.id,
        name: d.name,
        country: d.country,
        message: d.message,
        size: d.size,
        anchorKey: pos.anchorKey,
        coordinates: pos.coordinates as unknown as Vec3,
        rotation: pos.rotation as unknown as Vec3,
        scale: SIZE_SCALE[d.size] * pos.scale,
        createdAt: d.createdAt.toISOString(),
      });
    }
    return {
      id: car.id,
      index: car.index,
      status: car.status,
      totalAnchors: car.positions.length,
      occupied: car.positions.filter((p) => p.occupied).length,
      names,
    };
  });
}
