import {cache} from 'react';
import "server-only";
import { withOwnerDatabase } from "@/lib/owner-db";
export const readSettings=cache(async()=> {
  return withOwnerDatabase((tx, ownerId) => tx.userSettings.findUnique({ where: { userId: ownerId } }));
});
