import { PrismaClient } from "@prisma/client";
import { z } from "zod";
const prisma = new PrismaClient();
async function seed() {
  if (process.env.NODE_ENV === "production" || process.env.JARVIS_SEED_SYNTHETIC !== "true" || process.env.JARVIS_DATABASE_ENV !== "development") {
    throw new Error("Seed refused: explicitly opt into synthetic data on a development database only.");
  }
  // Owner must already exist in Supabase Auth. No invented identity or credentials.
  const ownerId = z.uuid().parse(process.env.JARVIS_OWNER_ID);
  const existing = await prisma.user.findUnique({ where: { id: ownerId } });
  if (existing && !existing.synthetic) throw new Error("Seed refused: existing non-synthetic owner data.");
  await prisma.user.upsert({
    where: { id: ownerId }, update: {},
    create: { id: ownerId, displayName: "Synthetic demonstration owner", synthetic: true, settings: { create: {} } }
  });
  console.info("Synthetic development owner/settings seeded. No services connected.");
}
seed().catch(() => { console.error("Seed failed. Check development flags, owner UUID and database setup; private details suppressed."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
