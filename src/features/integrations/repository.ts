import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {withOwnerDatabase} from '@/lib/owner-db';
import {providers,synchronize,type Credentials,type ProviderId} from './contract';
import {createMockConnector} from './mock-provider';
import {encryptToken,decryptToken} from './encryption';
export async function integrationStatus(){return withOwnerDatabase(async(tx,ownerId)=>{
 const connections=await tx.$queryRawUnsafe<{id:string;provider:string;mode:string;status:string;lastSyncAt:Date|null;retryAt:Date|null;syncIntervalMinutes:number}[]>(`SELECT id,provider,mode,status,"lastSyncAt","retryAt",CASE WHEN selection->>'canvasTransport'='feed' THEN COALESCE((selection->>'syncIntervalMinutes')::int,0) ELSE 0 END AS "syncIntervalMinutes" FROM "ApiConnection" WHERE "userId"=$1::uuid ORDER BY provider,mode`,ownerId);
 const imports=await tx.$queryRawUnsafe<{id:string;filename:string;importedCount:number;skippedCount:number;importedAt:Date}[]>('SELECT id,filename,"importedCount","skippedCount","importedAt" FROM "CsvImportBatch" WHERE "userId"=$1::uuid AND "importedAt" IS NOT NULL ORDER BY "importedAt" DESC LIMIT 4',ownerId);
 return {encryptionReady:/^[a-fA-F0-9]{64}$/.test(process.env.JARVIS_CONNECTOR_ENCRYPTION_KEY??''),connections:connections.map(c=>({...c,lastSyncAt:c.lastSyncAt?.toISOString()??null,retryAt:c.retryAt?.toISOString()??null})),imports:imports.map(i=>({...i,importedAt:i.importedAt.toISOString()}))};
});}
// Persistent mock synchronization is only usable by an explicitly synthetic development owner.
// The real owner's preview uses an isolated in-memory store, never this repository.
export async function synchronizeSyntheticProvider(provider:ProviderId){
 if(!providers.some(p=>p.id===provider))throw Error('Unknown provider.');
 return withOwnerDatabase(async(tx,ownerId)=>{
 const owner=await tx.$queryRawUnsafe<{synthetic:boolean}[]>('SELECT synthetic FROM "User" WHERE id=$1::uuid',ownerId);if(owner[0]?.synthetic!==true)throw Error('Mock synchronization cannot write into a real owner workspace.');
 const connector=createMockConnector(provider);const existing=await tx.$queryRawUnsafe<{id:string;tokenCiphertext:string|null;cursor:string|null}[]>('SELECT id,"tokenCiphertext",cursor FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider=$2 AND mode=\'mock\' FOR UPDATE',ownerId,provider);const id=existing[0]?.id??randomUUID();const context=ownerId+':'+id+':'+provider;
 let credentials:Credentials=existing[0]?.tokenCiphertext?JSON.parse(decryptToken(existing[0].tokenCiphertext,context)):await connector.authorize();const encrypted=encryptToken(JSON.stringify(credentials),context);
 await tx.$executeRawUnsafe('INSERT INTO "ApiConnection"(id,"userId",provider,mode,status,"tokenCiphertext","updatedAt")VALUES($1::uuid,$2::uuid,$3,\'mock\',\'syncing\',$4,now()) ON CONFLICT("userId",provider,mode) DO UPDATE SET status=\'syncing\',"tokenCiphertext"=EXCLUDED."tokenCiphertext","updatedAt"=now()',id,ownerId,provider,encrypted);
 // Serialize first-use/repeated syncs so one connection retains a stable credential context.
 const actual=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider=$2 AND mode=\'mock\' FOR UPDATE',ownerId,provider);if(actual[0].id!==id)throw Error('Concurrent connection setup. Retry.');
 try{credentials=await synchronize(connector,credentials,existing[0]?.cursor??null,{
 credentials:async value=>{await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET "tokenCiphertext"=$3 WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId,encryptToken(JSON.stringify(value),context));},
 upsert:async records=>{for(const record of records)await tx.$executeRawUnsafe('INSERT INTO "ExternalRecord"(id,"userId","connectionId","externalId",kind,payload,"sourceUrl","sourceUpdatedAt",deleted)VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6::jsonb,$7,$8::timestamptz,$9) ON CONFLICT("userId","connectionId","externalId") DO UPDATE SET payload=EXCLUDED.payload,"sourceUrl"=EXCLUDED."sourceUrl","sourceUpdatedAt"=EXCLUDED."sourceUpdatedAt","fetchedAt"=now(),deleted=EXCLUDED.deleted WHERE EXCLUDED.deleted<>"ExternalRecord".deleted OR EXCLUDED."sourceUpdatedAt">="ExternalRecord"."sourceUpdatedAt"',randomUUID(),ownerId,id,record.externalId,record.kind,JSON.stringify(record.data),record.sourceUrl,record.sourceUpdatedAt,record.deleted??false);},
 checkpoint:async cursor=>{await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET cursor=$3,"lastSyncAt"=now(),"updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId,cursor)},
 report:async(status,count,retryAfter)=>{await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET status=$3,"retryAt"=CASE WHEN $4::int IS NULL THEN NULL ELSE now()+($4::int*interval \'1 second\') END,"updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId,status,retryAfter??null);await tx.$executeRawUnsafe('INSERT INTO "SyncLog"(id,"userId","connectionId",status,"recordCount","errorCode")VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6)',randomUUID(),ownerId,id,status,count,status==='healthy'?null:status==='rate_limited'?'RATE_LIMIT':'SYNC_FAILED');}
 });
 return {provider,processed:true,credentialsStored:!!credentials.accessToken};}catch{return {provider,processed:false,credentialsStored:true};}
 });
}
export async function disconnectIntegration(id:string){z.uuid().parse(id);return withOwnerDatabase(async(tx,ownerId)=>{
 const count=await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET "tokenCiphertext"=NULL,cursor=NULL,"leaseToken"=NULL,"leaseUntil"=NULL,status=\'disconnected\',"retryAt"=NULL,"updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId);if(count!==1)throw Error('Connection unavailable.');await tx.auditLog.create({data:{userId:ownerId,action:'integration.disconnect',outcome:'success'}});return {ok:true};
});}
export async function sourceRecords(id:string,page=1){z.uuid().parse(id);z.number().int().min(1).max(100000).parse(page);return withOwnerDatabase(async(tx,ownerId)=>{
 const connection=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "ApiConnection" WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId);if(!connection.length)throw Error('Connection unavailable.');const count=await tx.$queryRawUnsafe<{count:bigint}[]>('SELECT count(*) FROM "ExternalRecord" WHERE "connectionId"=$1::uuid AND "userId"=$2::uuid AND deleted=false',id,ownerId);const total=Number(count[0].count),current=Math.min(page,Math.max(1,Math.ceil(total/4)));
 const rows=await tx.$queryRawUnsafe<{id:string;kind:string;payload:Record<string,string>;sourceUrl:string;sourceUpdatedAt:Date;fetchedAt:Date}[]>('SELECT id,kind,payload,"sourceUrl","sourceUpdatedAt","fetchedAt" FROM "ExternalRecord" WHERE "connectionId"=$1::uuid AND "userId"=$2::uuid AND deleted=false ORDER BY "sourceUpdatedAt" DESC,id LIMIT 4 OFFSET $3',id,ownerId,(current-1)*4);return {page:current,total,rows:rows.map(r=>({...r,sourceUpdatedAt:r.sourceUpdatedAt.toISOString(),fetchedAt:r.fetchedAt.toISOString()}))};
});}
export async function resetSourceCursor(id:string){z.uuid().parse(id);return withOwnerDatabase(async(tx,ownerId)=>{const updated=await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET cursor=NULL,"lastSyncAt"=NULL,status=\'authorized\',"retryAt"=NULL,"updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid AND ("leaseUntil" IS NULL OR "leaseUntil"<now())',id,ownerId);if(updated!==1)throw Error('Connection unavailable or synchronizing.');await tx.$executeRawUnsafe('DELETE FROM "ExternalRecord" WHERE "connectionId"=$1::uuid AND "userId"=$2::uuid',id,ownerId);await tx.auditLog.create({data:{userId:ownerId,action:'integration.reset_cursor',outcome:'success'}});});}
