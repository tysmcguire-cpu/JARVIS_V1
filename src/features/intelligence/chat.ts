import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {withCustomerDatabase} from '@/lib/customer-db';
import {features} from '@/features/commercial/flags';
import {validAnswer,type Answer} from '@/features/assistant/contract';
import {reserveUsage,settleUsage} from '@/features/usage/service';
import {chatInputSchema,aiPreferencesSchema,defaultAiPreferences} from './contracts';
import {collectEvidence,conversationWindow,localDate,inferredDomains} from './evidence';
import {applySelection,callGroundedModel,groundedModelRequest,modelConfig} from './model';
type Turn={id:string;threadId:string;question:string;answer:Answer|null;status:string;createdAt:Date};
function dto(row:Turn){return {...row,answer:row.answer?validAnswer(row.answer):null,createdAt:row.createdAt.toISOString()}}
export async function sendMessage(input:unknown){
 const request=chatInputSchema.parse(input);
 const initialized=await withCustomerDatabase(async(tx,id)=>{
  await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',id+':chat-init');
  const [existing]=await tx.$queryRawUnsafe<Turn[]>('SELECT id,"threadId",question,answer,status,"createdAt" FROM "ChatTurn" WHERE "userId"=$1::uuid AND "requestId"=$2::uuid',id,request.requestId);if(existing)return {existing};
  const [count]=await tx.$queryRawUnsafe<{count:number}[]>('SELECT count(*)::integer AS count FROM "ChatTurn" WHERE "userId"=$1::uuid AND "createdAt">now()-interval \'1 minute\'',id);if(count.count>=20)throw Error('Please wait before sending another message.');
  const threadId=request.threadId??randomUUID();
  if(request.threadId){const own=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "ChatThread" WHERE id=$1::uuid AND "userId"=$2::uuid',threadId,id);if(!own.length)throw Error('Conversation unavailable.')}else{const [threads]=await tx.$queryRawUnsafe<{count:number}[]>('SELECT count(*)::integer AS count FROM "ChatThread" WHERE "userId"=$1::uuid',id);if(threads.count>=100)throw Error('Remove an old conversation before creating another.');await tx.$executeRawUnsafe('INSERT INTO "ChatThread"(id,"userId",title)VALUES($1::uuid,$2::uuid,$3)',threadId,id,request.question.slice(0,100))}
  const [turnCount]=await tx.$queryRawUnsafe<{count:number}[]>('SELECT count(*)::integer AS count FROM "ChatTurn" WHERE "userId"=$1::uuid AND "threadId"=$2::uuid',id,threadId);if(turnCount.count>=200)throw Error('Start a new conversation for more messages.');
  const idTurn=randomUUID();await tx.$executeRawUnsafe('INSERT INTO "ChatTurn"(id,"userId","threadId","requestId",question,domains,status)VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6::text[],\'generating\')',idTurn,id,threadId,request.requestId,request.question,request.domains);
  await tx.auditLog.create({data:{userId:id,action:'customer.chat_requested',outcome:'success'}});await tx.$queryRawUnsafe('SELECT public.pluto_record_activity($1)::text','chat');
  const [settings]=await tx.$queryRawUnsafe<{timezone:string}[]>('SELECT timezone FROM "UserSettings" WHERE "userId"=$1::uuid',id),[preferences]=await tx.$queryRawUnsafe<Record<string,unknown>[]>('SELECT "sharingEnabled","allowedDomains","weeklyEnabled","reportDay","reportTime","telegramReports" FROM "AiPreferences" WHERE "userId"=$1::uuid',id);
  const history=await tx.$queryRawUnsafe<{question:string}[]>('SELECT question FROM "ChatTurn" WHERE "userId"=$1::uuid AND "threadId"=$2::uuid AND id<>$3::uuid ORDER BY "createdAt" DESC,id LIMIT 4',id,threadId,idTurn);
  return {id:idTurn,threadId,preferences:preferences?aiPreferencesSchema.parse(preferences):defaultAiPreferences,timezone:settings?.timezone??'UTC',history:history.reverse().map(t=>t.question)};
 });
 if('existing'in initialized&&initialized.existing)return dto(initialized.existing);
 if(!('id'in initialized)||!initialized.id)throw Error('Conversation unavailable.');
 let usageId:string|undefined;let measured:Awaited<ReturnType<typeof callGroundedModel>>['usage']|undefined;
 try{
  const scopes=inferredDomains(request.question,request.domains,initialized.history),window=conversationWindow(request.question,localDate(initialized.timezone!));const evidence=await collectEvidence(withCustomerDatabase,scopes,{...window,financialEnd:window.end<localDate(initialized.timezone!)?window.end:localDate(initialized.timezone!)});
  const allowed=initialized.preferences!.sharingEnabled&&scopes.every(d=>initialized.preferences!.allowedDomains.includes(d));
  let answer=evidence;
  if(features.aiChat()&&!!process.env.OPENAI_API_KEY&&allowed){const config=modelConfig(),modelRequest=groundedModelRequest(request.question,initialized.history!,evidence,config);usageId=await reserveUsage('chat','chat:'+request.requestId,modelRequest.cap);const result=await callGroundedModel(modelRequest,config);answer=validAnswer(applySelection(evidence,result.selection,request.recommendations));measured=result.usage}else answer=validAnswer({...evidence,limitations:[...evidence.limitations,allowed?'Paid AI is disabled or unconfigured; these are local facts.':'AI sharing is not enabled for every selected domain; nothing was sent to a provider.']});
  await withCustomerDatabase(async(tx,id)=>{if(usageId&&measured)await settleUsage(usageId,true,measured,work=>work(tx,id));await tx.$executeRawUnsafe('UPDATE "ChatTurn" SET answer=$3::jsonb,status=\'completed\',"usageId"=$4::uuid,"completedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid AND status=\'generating\'',initialized.id,id,JSON.stringify(answer),usageId??null);await tx.$executeRawUnsafe('UPDATE "ChatThread" SET "updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',initialized.threadId,id)});
 }catch{if(usageId)try{await settleUsage(usageId,false,{inputTokens:0,outputTokens:0,costMicros:0,voiceSeconds:0,researchCalls:0,model:process.env.PLUTO_CHAT_MODEL??'unconfigured'})}catch{}await withCustomerDatabase((tx,id)=>tx.$executeRawUnsafe('UPDATE "ChatTurn" SET status=\'failed\',"completedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',initialized.id,id))}
 return withCustomerDatabase(async(tx,id)=>{const [row]=await tx.$queryRawUnsafe<Turn[]>('SELECT id,"threadId",question,answer,status,"createdAt" FROM "ChatTurn" WHERE id=$1::uuid AND "userId"=$2::uuid',initialized.id,id);if(!row)throw Error('Conversation unavailable.');return dto(row)});
}
export async function threadList(pageInput:unknown=1){const page=z.number().int().min(1).max(10000).parse(pageInput);return withCustomerDatabase(async(tx,id)=>{const rows=await tx.$queryRawUnsafe<{id:string;title:string;updatedAt:Date}[]>('SELECT id,title,"updatedAt" FROM "ChatThread" WHERE "userId"=$1::uuid ORDER BY "updatedAt" DESC,id LIMIT 21 OFFSET $2',id,(page-1)*20);return {rows:rows.slice(0,20).map(r=>({...r,updatedAt:r.updatedAt.toISOString()})),more:rows.length>20,page}})}
export async function threadTurns(idInput:unknown,pageInput:unknown=1){const thread=z.uuid().parse(idInput),page=z.number().int().min(1).max(10000).parse(pageInput);return withCustomerDatabase(async(tx,id)=>{const rows=await tx.$queryRawUnsafe<Turn[]>('SELECT id,"threadId",question,answer,status,"createdAt" FROM "ChatTurn" WHERE "threadId"=$1::uuid AND "userId"=$2::uuid ORDER BY "createdAt" DESC,id LIMIT 21 OFFSET $3',thread,id,(page-1)*20);return {rows:rows.slice(0,20).reverse().map(dto),more:rows.length>20,page}})}
export async function removeThread(idInput:unknown){const thread=z.uuid().parse(idInput);return withCustomerDatabase((tx,id)=>tx.$executeRawUnsafe('DELETE FROM "ChatThread" WHERE id=$1::uuid AND "userId"=$2::uuid',thread,id))}
