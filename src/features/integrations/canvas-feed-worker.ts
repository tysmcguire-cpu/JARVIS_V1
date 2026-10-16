import 'server-only';
import {z} from 'zod';
import {db} from '@/lib/db';
import type {withOwnerDatabase} from '@/lib/owner-db';
import {synchronizeWithDatabase} from './live-service';

// Background identity comes only from the server allowlist, never a request parameter.
export async function canvasFeedTick(){
 const owner=z.uuid().parse(process.env.JARVIS_OWNER_ID);
 const run:typeof withOwnerDatabase=async work=>db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${owner},true)`;
  const valid=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "User" WHERE id=$1::uuid AND synthetic=false',owner);if(!valid.length)throw Error('Owner unavailable.');
  return work(tx,owner);
 },{timeout:15000});
 return refreshDueCanvasFeeds(run);
}
export async function refreshDueCanvasFeeds(run:typeof withOwnerDatabase){
 const rows=await run((tx,owner)=>tx.$queryRawUnsafe<{id:string}[]>(`SELECT id FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider='canvas' AND mode='live' AND status<>'disconnected' AND "tokenCiphertext" IS NOT NULL AND "consentedAt" IS NOT NULL AND selection->>'canvasTransport'='feed' AND selection->>'syncIntervalMinutes' IN ('15','60','360') AND ("leaseUntil" IS NULL OR "leaseUntil"<now()) AND ("retryAt" IS NULL OR "retryAt"<=now()) AND ("lastSyncAt" IS NULL OR "lastSyncAt"<=now()-(selection->>'syncIntervalMinutes')::int*interval '1 minute') LIMIT 1`,owner));
 for(const row of rows)await synchronizeWithDatabase(row.id,run);
 return rows.length;
}
