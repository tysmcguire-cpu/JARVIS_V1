import 'server-only';
import {withBillingDatabase} from './database';
import {reconcileCustomer} from './service';
export async function reconcileBillingTick(){if(process.env.PLUTO_BILLING_RECONCILE_ENABLED!=='true')return 0;const rows=await withBillingDatabase(tx=>tx.$queryRawUnsafe<{stripeCustomerId:string}[]>('SELECT "stripeCustomerId" FROM "BillingCustomer" WHERE "reconciledAt" IS NULL OR "reconciledAt"<now()-interval \'1 hour\' ORDER BY "reconciledAt" NULLS FIRST LIMIT 2'));for(const row of rows)await reconcileCustomer(row.stripeCustomerId);return rows.length}
