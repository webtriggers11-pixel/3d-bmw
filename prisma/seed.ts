import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_ANCHORS } from "../lib/anchors";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Car #1 with its anchor positions. Idempotent: upsert each anchor so that
  // re-running the seed re-syncs coordinates/rotation when DEFAULT_ANCHORS is
  // retuned, without disturbing any donation already attached to a position.
  const car = await prisma.car.upsert({
    where: { index: 1 },
    update: {},
    create: { index: 1, status: "ACTIVE" },
  });
  for (const a of DEFAULT_ANCHORS) {
    await prisma.position.upsert({
      where: { carId_anchorKey: { carId: car.id, anchorKey: a.anchorKey } },
      update: { coordinates: a.coordinates, rotation: a.rotation },
      create: {
        carId: car.id,
        anchorKey: a.anchorKey,
        coordinates: a.coordinates,
        rotation: a.rotation,
        scale: 1,
      },
    });
  }
  console.log(`Seed: synced car #1 with ${DEFAULT_ANCHORS.length} anchors.`);

  // Default settings.
  await prisma.settings.upsert({
    where: { key: "auto_moderation" },
    update: {},
    create: { key: "auto_moderation", value: { requireApproval: false } },
  });
  await prisma.settings.upsert({
    where: { key: "min_contribution_paise" },
    update: {},
    create: { key: "min_contribution_paise", value: 5000 },
  });

  console.log("Seed: done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
