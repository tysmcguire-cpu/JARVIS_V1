import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {withOwnerDatabase} from '@/lib/owner-db';
import {askSchema,type Answer,type Entry} from './contract';
import {analyze} from './analysis';
import {interpretQuestion,composeGroundedAnswer,aiReady} from './provider';
import {storeReferences} from './storage';
const uuid=z.string().uuid();
export async function history(pageInput:unknown=1){const page=z.number().int().min(1).max(10000).parse(pageInput);return withOwnerDatabase(async(tx,owner)=>{
 const rows=await tx.$queryRawUnsafe<{id:string;question:string;createdAt:Date;status:string}[]>('SELECT id,left(question,100) AS question,"createdAt",status FROM "AiConversation" WHERE "userId"=$1::uuid ORDER BY "createdAt" DESC,id LIMIT 5 OFFSET $2',owner,(page-1)*4);return {rows:rows.slice(0,4).map(r=>({...r,createdAt:r.createdAt.toISOString()})),more:rows.length>4,ready:aiReady()};
})}
export async function detail(idInput:unknown):Promise<Entry>{const id=uuid.parse(idInput);return withOwnerDatabase(async(tx,owner)=>{const rows=await tx.$queryRawUnsafe<{id:string;question:string;answer:Answer|null;createdAt:Date}[]>('SELECT id,question,answer,"createdAt" FROM "AiConversation" WHERE id=$1::uuid AND "userId"=$2::uuid AND status=\'complete\'',id,owner);if(!rows[0]?.answer)throw Error('Conversation unavailable');return {...rows[0],answer:rows[0].answer,createdAt:rows[0].createdAt.toISOString()}})}
export async function removeConversation(idInput:unknown){const id=uuid.parse(idInput);return withOwnerDatabase(async(tx,owner)=>{const changed=await tx.$executeRawUnsafe('DELETE FROM "AiConversation" WHERE id=$1::uuid AND "userId"=$2::uuid',id,owner);if(changed)await tx.auditLog.create({data:{userId:owner,action:'assistant.delete',outcome:'success'}})})}
export async function ask(input:unknown):Promise<Entry>{
 const request=askSchema.parse(input);if(request.interpret&&!request.consent)throw Error('Confirm sharing the question with OpenAI first.');
 const id=randomUUID();await withOwnerDatabase(async(tx,owner)=>{
 await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',owner+':assistant');
 const counts=await tx.$queryRawUnsafe<{count:string}[]>('SELECT count(*)::text AS count FROM "AuditLog" WHERE "userId"=$1::uuid AND action=\'assistant.request\' AND "createdAt">now()-interval \'1 hour\'',owner);if(Number(counts[0].count)>=20)throw Error('Assistant limit reached: 20 requests per hour.');
 await tx.$executeRawUnsafe('INSERT INTO "AiConversation"(id,"userId",question,query,status)VALUES($1::uuid,$2::uuid,$3,$4::jsonb,\'pending\')',id,owner,request.question,JSON.stringify(request.query));
 await tx.auditLog.create({data:{userId:owner,action:'assistant.request',outcome:'success'}});
 });
 try{
 const query=request.interpret?await interpretQuestion(request.question,request.query):request.query;
 const evidence=await withOwnerDatabase((tx,owner)=>analyze(tx,owner,{...query,recommendations:request.compose?false:query.recommendations}));
 const answer=request.compose?await composeGroundedAnswer(request.question,evidence,query.recommendations):evidence;if(request.interpret&&!request.compose)answer.engine='OpenAI question interpretation + local validated tools';
 await withOwnerDatabase(async(tx,owner)=>{
 const changed=await tx.$executeRawUnsafe('UPDATE "AiConversation" SET answer=$3::jsonb,query=$4::jsonb,status=\'complete\' WHERE id=$1::uuid AND "userId"=$2::uuid AND status=\'pending\'',id,owner,JSON.stringify(answer),JSON.stringify(query));if(!changed)throw Error('Conversation unavailable');
 await storeReferences(tx,owner,id,answer.sources);
 await tx.auditLog.create({data:{userId:owner,action:'assistant.ask',outcome:'success'}});
 });return detail(id);
 }catch{await withOwnerDatabase((tx,owner)=>tx.$executeRawUnsafe('UPDATE "AiConversation" SET status=\'failed\' WHERE id=$1::uuid AND "userId"=$2::uuid AND status=\'pending\'',id,owner));throw Error('Assistant could not complete this request. Check setup or try local analysis.');}
}
