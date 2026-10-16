import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {withOwnerDatabase} from '@/lib/owner-db';
import {providers,synchronize,type Credentials,type ProviderId} from './contract';
import {encryptToken,decryptToken} from './encryption';
import {createReadOnlyConnector,type AuthorizedGrant} from './http-providers';
type OwnerDatabase=typeof withOwnerDatabase;
export async function synchronizeWithDatabase(id:string,withOwnerDatabase:OwnerDatabase){
 z.uuid().parse(id);const lease=randomUUID();
 const state=await withOwnerDatabase(async(tx,ownerId)=>{
 const rows=await tx.$queryRawUnsafe<{provider:ProviderId;selection:{resources:string[];canvasOrigin?:string;canvasTransport?:'feed';syncIntervalMinutes?:number};tokenCiphertext:string|null;cursor:string|null;available:boolean;retry:boolean;consentedAt:Date|null}[]>('SELECT provider,selection,"tokenCiphertext",cursor,"consentedAt",("leaseUntil" IS NULL OR "leaseUntil"<now()) AS available,("retryAt" IS NULL OR "retryAt"<=now()) AS retry FROM "ApiConnection" WHERE id=$1::uuid AND "userId"=$2::uuid AND mode=\'live\' FOR UPDATE',id,ownerId);
 const row=rows[0];if(!row?.tokenCiphertext||!row.consentedAt||!providers.some(p=>p.id===row.provider))throw Error('Authorize this connection first.');if(!row.available)throw Error('Synchronization is already running.');if(!row.retry)throw Error('Provider retry delay is still active.');
 await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET status=\'syncing\',"leaseToken"=$3::uuid,"leaseUntil"=now()+interval \'120 seconds\',"updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId,lease);return {...row,ownerId};
 });
 const leased=<T>(run:(tx:Parameters<Parameters<typeof withOwnerDatabase>[0]>[0],ownerId:string)=>Promise<T>)=>withOwnerDatabase(async(tx,ownerId)=>{
 if(ownerId!==state.ownerId)throw Error('Owner session changed.');const valid=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "ApiConnection" WHERE id=$1::uuid AND "userId"=$2::uuid AND "leaseToken"=$3::uuid AND "tokenCiphertext" IS NOT NULL FOR UPDATE',id,ownerId,lease);if(!valid.length)throw Error('Connection changed or disconnected.');await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET "leaseUntil"=now()+interval \'120 seconds\' WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId);return run(tx,ownerId);
 });
 let count=0;const seenIds=new Set<string>();
 try{
 const context=state.ownerId+':'+id+':'+state.provider;const secret=JSON.parse(decryptToken(state.tokenCiphertext!,context)) as {credentials:Credentials;googleClient?:AuthorizedGrant['googleClient'];appleUsername?:string};const grant:AuthorizedGrant={approved:true,credentials:secret.credentials,googleClient:secret.googleClient,appleUsername:secret.appleUsername,resources:state.selection.resources,canvasOrigin:state.selection.canvasOrigin,canvasTransport:state.selection.canvasTransport,syncIntervalMinutes:state.selection.syncIntervalMinutes};const connector=createReadOnlyConnector(state.provider,grant);
 await synchronize(connector,secret.credentials,state.cursor,{
 credentials:async credentials=>{await leased((tx,ownerId)=>tx.$executeRawUnsafe('UPDATE "ApiConnection" SET "tokenCiphertext"=$3 WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId,encryptToken(JSON.stringify({...secret,credentials}),context)));},
 upsert:async records=>{for(const record of records)seenIds.add(record.externalId);await leased(async(tx,ownerId)=>{if(!records.length)return;const payload=records.map(r=>({...r,id:randomUUID(),payload:r.data,deleted:r.deleted??false}));await tx.$executeRawUnsafe(`INSERT INTO "ExternalRecord"(id,"userId","connectionId","externalId",kind,payload,"sourceUrl","sourceUpdatedAt",deleted) SELECT id,$1::uuid,$2::uuid,"externalId",kind,payload,"sourceUrl","sourceUpdatedAt"::timestamptz,deleted FROM jsonb_to_recordset($3::jsonb) AS r(id uuid,"externalId" text,kind text,payload jsonb,"sourceUrl" text,"sourceUpdatedAt" text,deleted boolean) ON CONFLICT("userId","connectionId","externalId") DO UPDATE SET payload=EXCLUDED.payload,"sourceUrl"=EXCLUDED."sourceUrl","sourceUpdatedAt"=EXCLUDED."sourceUpdatedAt","fetchedAt"=now(),deleted=EXCLUDED.deleted WHERE EXCLUDED.deleted<>"ExternalRecord".deleted OR EXCLUDED."sourceUpdatedAt">="ExternalRecord"."sourceUpdatedAt"`,ownerId,id,JSON.stringify(payload));});},
 checkpoint:async cursor=>{await leased(async(tx,ownerId)=>{if(state.provider==='canvas'||state.provider==='apple-calendar')await tx.$executeRawUnsafe('UPDATE "ExternalRecord" SET deleted=true WHERE "userId"=$1::uuid AND "connectionId"=$2::uuid AND "externalId" NOT IN(SELECT jsonb_array_elements_text($3::jsonb))',ownerId,id,JSON.stringify([...seenIds]));return tx.$executeRawUnsafe('UPDATE "ApiConnection" SET cursor=$3,"lastSyncAt"=now(),"updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId,cursor);});},
 report:async(status,processed,retryAfter)=>{count=processed;await leased(async(tx,ownerId)=>{
 await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET status=$3,"retryAt"=CASE WHEN $4::int IS NULL THEN NULL ELSE now()+($4::int*interval \'1 second\') END,"leaseToken"=NULL,"leaseUntil"=NULL,"updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId,status,retryAfter??(status==='error'?Math.max(30,(state.selection.syncIntervalMinutes??0)*60):null));await tx.$executeRawUnsafe('INSERT INTO "SyncLog"(id,"userId","connectionId",status,"recordCount","errorCode")VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6)',randomUUID(),ownerId,id,status,processed,status==='healthy'?null:status==='rate_limited'?'RATE_LIMIT':'SYNC_FAILED');
 });}
 });
 return {ok:true,count};
 }catch{
 // A provider error normally reports/releases its lease through the engine. If setup failed
 // before that, release only our own lease and retain a redacted status for an explicit retry.
 try{await withOwnerDatabase(async(tx,ownerId)=>{await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET status=\'error\',"leaseToken"=NULL,"leaseUntil"=NULL,"retryAt"=now()+interval \'30 seconds\',"updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid AND "leaseToken"=$3::uuid',id,ownerId,lease);});}catch{/* An expired lease permits recovery after database availability returns. */}
 return {ok:false,count};
 }
}
