import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {withOwnerDatabase} from '@/lib/owner-db';
import {encryptToken} from './encryption';
import {synchronizeWithDatabase} from './sync-service';
import {createReadOnlyConnector} from './http-providers';
export const grantSchema=z.object({approved:z.literal(true),provider:z.enum(['google-calendar','apple-calendar','github','canvas']),credentials:z.object({accessToken:z.string().min(1).max(16000),refreshToken:z.string().max(16000).optional(),expiresAt:z.number().finite().positive()}),resources:z.array(z.string().min(1).max(500)).min(1).max(20),googleClient:z.object({id:z.string().min(1).max(500),secret:z.string().min(1).max(500)}).optional(),canvasOrigin:z.string().max(200).optional(),appleUsername:z.email().max(254).optional(),canvasTransport:z.literal('feed').optional(),syncIntervalMinutes:z.union([z.literal(0),z.literal(15),z.literal(60),z.literal(360)]).optional()}).strict();
export async function registerConnection(input:unknown){
 const grant=grantSchema.parse(input);createReadOnlyConnector(grant.provider,grant);
 return withOwnerDatabase(async(tx,ownerId)=>{
 const existing=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider=$2 AND mode=\'live\' FOR UPDATE',ownerId,grant.provider);const id=existing[0]?.id??randomUUID();const context=ownerId+':'+id+':'+grant.provider;
 const envelope=encryptToken(JSON.stringify({credentials:grant.credentials,googleClient:grant.googleClient,appleUsername:grant.appleUsername}),context);
 const selection=JSON.stringify({resources:grant.resources,canvasOrigin:grant.canvasOrigin,canvasTransport:grant.canvasTransport,syncIntervalMinutes:grant.canvasTransport==='feed'?grant.syncIntervalMinutes??0:0});
 await tx.$executeRawUnsafe('INSERT INTO "ApiConnection"(id,"userId",provider,mode,status,selection,"tokenCiphertext","consentedAt","updatedAt")VALUES($1::uuid,$2::uuid,$3,\'live\',\'authorized\',$4::jsonb,$5,now(),now()) ON CONFLICT("userId",provider,mode) DO UPDATE SET status=\'authorized\',selection=EXCLUDED.selection,"tokenCiphertext"=EXCLUDED."tokenCiphertext",cursor=NULL,"lastSyncAt"=NULL,"retryAt"=NULL,"leaseToken"=NULL,"leaseUntil"=NULL,"consentedAt"=now(),"updatedAt"=now()',id,ownerId,grant.provider,selection,envelope);
 const row=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider=$2 AND mode=\'live\'',ownerId,grant.provider);if(row[0]?.id!==id)throw Error('Concurrent authorization setup. Retry.');
 await tx.$executeRawUnsafe('DELETE FROM "ExternalRecord" WHERE "userId"=$1::uuid AND "connectionId"=$2::uuid',ownerId,id);
 await tx.auditLog.create({data:{userId:ownerId,action:'integration.authorize.'+grant.provider,outcome:'success'}});return {id};
 });
}
export async function synchronizeConnection(id:string){return synchronizeWithDatabase(id,withOwnerDatabase)}
