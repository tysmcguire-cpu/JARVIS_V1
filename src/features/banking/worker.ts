import 'server-only';



import {syncBank,type BankRun} from './service';
export async function bankTick(){throw Error('Automatic banking is retired in Pluto.')}
export async function refreshDueBank(run:BankRun){
 const rows=await run((tx,owner)=>tx.$queryRawUnsafe<{id:string}[]>(`SELECT id FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider='plaid' AND mode='live' AND status<>'disconnected' AND selection->>'connected'='true' AND COALESCE(selection->>'automaticSync','true')='true' AND "tokenCiphertext" IS NOT NULL AND "consentedAt" IS NOT NULL AND ("leaseUntil" IS NULL OR "leaseUntil"<now()) AND ("retryAt" IS NULL OR "retryAt"<=now()) AND ("lastSyncAt" IS NULL OR "lastSyncAt"<=now()-CASE WHEN COALESCE(selection->>'historyStatus','NOT_READY')<>'HISTORICAL_UPDATE_COMPLETE' THEN interval '5 minutes' ELSE COALESCE((selection->>'syncMinutes')::int,360)*interval '1 minute' END) LIMIT 1`,owner));
 for(const _row of rows){void _row;await syncBank(run)}return rows.length;
}
