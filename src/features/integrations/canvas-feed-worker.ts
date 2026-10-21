import 'server-only';

import {withWorkerCustomer} from '@/lib/worker-db';
import type {withCustomerDatabase} from '@/lib/customer-db';
import {synchronizeWithDatabase} from './sync-service';

export async function canvasFeedTick(id:string){return refreshDueCanvasFeeds(work=>withWorkerCustomer(id,work))}
export async function refreshDueCanvasFeeds(run:typeof withCustomerDatabase){
 const rows=await run((tx,owner)=>tx.$queryRawUnsafe<{id:string}[]>(`SELECT id FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider='canvas' AND mode='live' AND status<>'disconnected' AND "tokenCiphertext" IS NOT NULL AND "consentedAt" IS NOT NULL AND selection->>'canvasTransport'='feed' AND selection->>'syncIntervalMinutes' IN ('15','60','360') AND ("leaseUntil" IS NULL OR "leaseUntil"<now()) AND ("retryAt" IS NULL OR "retryAt"<=now()) AND ("lastSyncAt" IS NULL OR "lastSyncAt"<=now()-(selection->>'syncIntervalMinutes')::int*interval '1 minute') LIMIT 1`,owner));
 for(const row of rows)await synchronizeWithDatabase(row.id,run);
 return rows.length;
}
