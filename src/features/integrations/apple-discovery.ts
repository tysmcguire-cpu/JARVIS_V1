import 'server-only';
import {withOwnerDatabase} from '@/lib/owner-db';
import {appleCredentialsSchema,discoverAppleCalendars} from './apple-calendar';

export async function discoverOwnerAppleCalendars(input:unknown){
 const credentials=appleCredentialsSchema.parse(input);
 await withOwnerDatabase(async(tx,owner)=>{
  await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',owner+':apple-discovery');
  const rows=await tx.$queryRawUnsafe<{count:bigint}[]>('SELECT count(*) FROM "AuditLog" WHERE "userId"=$1::uuid AND action=\'integration.apple.discovery\' AND "createdAt">now()-interval \'1 hour\'',owner);
  if(Number(rows[0].count)>=20)throw Error('Calendar discovery limit reached. Try again later.');
  await tx.auditLog.create({data:{userId:owner,action:'integration.apple.discovery',outcome:'requested'}});
 });
 // No credentials are stored and no event contents are requested during discovery.
 return discoverAppleCalendars(credentials);
}
