import 'server-only';
import {z} from 'zod';
import {db} from '@/lib/db';
import {bankAvailability} from './config';
import {syncBank,type BankRun} from './service';
export async function bankTick(){
 if(!bankAvailability().ready)return 0;const owner=z.uuid().parse(process.env.PLUTO_OWNER_ID);
 const run:BankRun=async work=>db.$transaction(async tx=>{await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${owner},true)`;const valid=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "User" WHERE id=$1::uuid AND synthetic=false',owner);if(!valid.length)throw Error('Owner unavailable.');return work(tx,owner)},{timeout:15000});
 return refreshDueBank(run);
}
export async function refreshDueBank(run:BankRun){
 const rows=await run((tx,owner)=>tx.$queryRawUnsafe<{id:string}[]>(`SELECT id FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider='plaid' AND mode='live' AND status<>'disconnected' AND selection->>'connected'='true' AND COALESCE(selection->>'automaticSync','true')='true' AND "tokenCiphertext" IS NOT NULL AND "consentedAt" IS NOT NULL AND ("leaseUntil" IS NULL OR "leaseUntil"<now()) AND ("retryAt" IS NULL OR "retryAt"<=now()) AND ("lastSyncAt" IS NULL OR "lastSyncAt"<=now()-CASE WHEN COALESCE(selection->>'historyStatus','NOT_READY')<>'HISTORICAL_UPDATE_COMPLETE' THEN interval '5 minutes' ELSE COALESCE((selection->>'syncMinutes')::int,360)*interval '1 minute' END) LIMIT 1`,owner));
 for(const _row of rows){void _row;await syncBank(run)}return rows.length;
}
