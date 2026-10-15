import "server-only";
import { db } from "@/lib/db";
import { requireOwner } from "@/features/auth/server";
export async function readSettings() {
  const owner = await requireOwner();
  // Explicit ownership is required even with a privileged Prisma connection.
  return db.userSettings.findUnique({ where: { userId: owner.id } });
}
