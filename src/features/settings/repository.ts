import {cache} from 'react';
import "server-only";
import { withCustomerDatabase } from "@/lib/customer-db";
export const readSettings=cache(async()=> {
  return withCustomerDatabase((tx, ownerId) => tx.userSettings.findUnique({ where: { userId: ownerId } }));
});
