import "server-only";
import { withOwnerDatabase } from "@/lib/owner-db";
export async function readSettings() {
  return withOwnerDatabase((tx, ownerId) => tx.userSettings.findUnique({ where: { userId: ownerId } }));
}
