import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOwner } from "@/features/auth/server";

export async function withOwnerDatabase<T>(query: (tx: Prisma.TransactionClient, ownerId: string) => Promise<T>): Promise<T> {
  const owner = await requireOwner();
  return db.$transaction(async tx => {
    // Transaction-local identity cannot leak across pooled database connections.
    await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub', ${owner.id}, true)`;
    return query(tx, owner.id);
  });
}
