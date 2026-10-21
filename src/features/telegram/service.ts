import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { validateRecord } from '@/features/tracking/validation';
import {quickMoneyInput,quickAccountBalance} from './quick-money-service';
import { formatMoney,parseMoney } from '@/features/tracking/config';
import { approvedUpdate, hashCode, type TelegramConfig } from './config';
import { CommandError, helpText, parseCommand, requireParts } from './commands';
import { sendReply, TelegramDeliveryError } from './transport';
import {analyze} from '@/features/assistant/analysis';
import {querySchema} from '@/features/assistant/contract';
import {storeReferences} from '@/features/assistant/storage';
type Tx=Prisma.TransactionClient;
export async function withBotDatabase<T>(config:TelegramConfig,run:(tx:Tx)=>Promise<T>):Promise<T>{return db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${config.ownerId},true)`;
 const owner=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "User" WHERE id=$1::uuid AND synthetic=false',config.ownerId);if(!owner.length)throw Error('Owner unavailable');return run(tx);
},{timeout:20000});}
async function exactParent(tx:Tx,ownerId:string,key:'Task'|'FinancialAccount'|'Category',title:string,kind?:string){
 const result=await tx.$queryRawUnsafe<{id:string}[]>(`SELECT id FROM "${key}" WHERE "userId"=$1::uuid AND lower(title)=lower($2) ${kind?'AND kind=$3':''} LIMIT 2`,ownerId,title,...(kind?[kind]:[]));
 if(result.length!==1)throw new CommandError(`Use one exact, unique ${key==='FinancialAccount'?'account':key.toLowerCase()} title from the website${kind?' with type '+kind:''}. No record was saved.`);return result[0].id;
}
async function insert(tx:Tx,ownerId:string,key:'Task'|'Note'|'Reminder'|'Transaction',input:Record<string,string>){
 let values:ReturnType<typeof validateRecord>;try{values=validateRecord(key,input)}catch(error){throw new CommandError(error instanceof Error?error.message:'Invalid fields. See /help.')}
 const id=randomUUID(),fields=Object.keys(values);const casts=fields.map(k=>k.endsWith('Id')?'::uuid':['date','dueDate'].includes(k)?'::date':'');
 await tx.$executeRawUnsafe(`INSERT INTO "${key}" (${fields.map(f=>'"'+f+'"').join(',')},id,"userId","updatedAt") VALUES (${fields.map((_,i)=>'$'+(i+1)+casts[i]).join(',')},$${fields.length+1}::uuid,$${fields.length+2}::uuid,date_trunc('milliseconds',clock_timestamp()))`,...Object.values(values),id,ownerId);
 const record=await tx.$queryRawUnsafe<{updatedAt:Date}[]>(`SELECT "updatedAt" FROM "${key}" WHERE id=$1::uuid AND "userId"=$2::uuid`,id,ownerId);
 return {entity:key,recordId:id,recordVersion:record[0].updatedAt};
}
type Outcome={reply:string;entity?:string;recordId?:string;recordVersion?:Date};
async function execute(tx:Tx,config:TelegramConfig,text:string,updateId:number):Promise<Outcome>{
 const command=parseCommand(text),{name,parts,args}=command;const owner=config.ownerId;
 const identity=await tx.$queryRawUnsafe<{pairedAt:Date|null;pairingHash:string|null;pairingExpiresAt:Date|null}[]>('SELECT "pairedAt","pairingHash","pairingExpiresAt" FROM "TelegramIdentity" WHERE "userId"=$1::uuid AND "botId"=$2 AND "telegramUserId"=$3 AND "chatId"=$4',owner,config.botId,config.userId,config.chatId);
 if(!identity.length)return {reply:'Open PLUTO Settings and create a pairing code before using this bot.'};
 if(name==='start'){
   const paired=await tx.$executeRawUnsafe('UPDATE "TelegramIdentity" SET "pairedAt"=now(),"pairingHash"=NULL,"pairingExpiresAt"=NULL,"updatedAt"=now() WHERE "userId"=$1::uuid AND "botId"=$2 AND "telegramUserId"=$3 AND "chatId"=$4 AND "pairingHash"=$5 AND "pairingExpiresAt">now()',owner,config.botId,config.userId,config.chatId,hashCode(args));
   if(paired){await audit(tx,owner,'pair');return {reply:'PLUTO paired to your approved private chat. Use /help for commands. Telegram bot chats are not end-to-end encrypted.'}}
   return {reply:identity[0].pairedAt?'Already paired. Use /help.':'Pairing code invalid or expired. Generate a new code in PLUTO Settings.'};
 }
 if(!identity[0].pairedAt)return {reply:'Pair first: generate a code in PLUTO Settings, then send /start CODE here.'};
 if(name==='help')return {reply:helpText};
 if(name==='money'){
 const entry=await quickMoneyInput(tx,owner,args),outcome=await insert(tx,owner,'Transaction',entry.input),balance=await quickAccountBalance(tx,owner,entry.account.id);
 await audit(tx,owner,'create.Transaction');return {...outcome,reply:`Saved ${entry.kind==='income'?'+':'−'}${formatMoney(parseMoney(entry.input.amount),entry.account.currency)} · ${entry.category}.\n${entry.account.title} balance: ${formatMoney(balance,entry.account.currency)}.\n/undo to remove this entry.`};
 }

 if(name==='ask'){
 requireParts(parts,3,4);let query;try{query=querySchema.parse({domain:parts[0],start:parts[1],end:parts[2],search:parts[3]??'',view:'summary',recommendations:false})}catch{throw new CommandError('Use /ask domain | YYYY-MM-DD | YYYY-MM-DD | optional title search. Domains: finances, education, calendar, career, projects, goals, notes, sources, weekly. Maximum 366 days.');}
 const answer=await analyze(tx,owner,query);const id=randomUUID();await tx.$executeRawUnsafe('INSERT INTO "AiConversation"(id,"userId",question,query,answer,status)VALUES($1::uuid,$2::uuid,$3,$4::jsonb,$5::jsonb,\'complete\')',id,owner,('/ask '+args).slice(0,1000),JSON.stringify(query),JSON.stringify(answer));
 await storeReferences(tx,owner,id,answer.sources);
 return {reply:answer.claims.slice(0,2).map(c=>{const s=answer.sources.find(s=>s.id===c.sourceIds[0])!;return `${c.kind.toUpperCase()}: ${c.text}\nSource: ${s.label}; updated ${s.updatedAt}; retrieved ${s.fetchedAt}`}).join('\n\n')+`\n\nLocal analysis of stored records; missing/unsynced data unknown. ${answer.claims.length} result(s). Open PLUTO Assistant history for all sources and coverage. No OpenAI call made.`};
 }
 if(name==='status'){
   const pending=await tx.$queryRawUnsafe<{count:bigint}[]>('SELECT count(*) FROM "TelegramMessage" WHERE "userId"=$1::uuid AND "botId"=$2 AND "deliveredAt" IS NULL AND "canceledAt" IS NULL',owner,config.botId);
   return {reply:`Owner paired. Database available. ${pending[0].count} pending replies. Manual commands and local /ask analysis enabled. Notification schedules and delivery status are in PLUTO Notifications.`};
 }
 if(name==='undo'){
   const previous=await tx.$queryRawUnsafe<{id:string;entity:string;recordId:string;recordVersion:Date}[]>('SELECT id,entity,"recordId","recordVersion" FROM "TelegramMessage" WHERE "userId"=$1::uuid AND "botId"=$2 AND "updateId"<$3 AND entity IS NOT NULL AND undone=false AND "createdAt">now()-interval \'24 hours\' ORDER BY "updateId" DESC,id DESC LIMIT 1 FOR UPDATE',owner,config.botId,BigInt(updateId));
   if(!previous.length)return {reply:'Nothing eligible to undo in the last 24 hours.'};const row=previous[0];if(!['Task','Note','Reminder','Transaction'].includes(row.entity))throw Error('Invalid undo target');
   const deleted=await tx.$executeRawUnsafe(`DELETE FROM "${row.entity}" WHERE id=$1::uuid AND "userId"=$2::uuid AND "updatedAt"=$3`,row.recordId,owner,row.recordVersion);
   if(!deleted)return {reply:'That record was edited or removed after Telegram created it. No record was changed.'};
   await tx.$executeRawUnsafe('UPDATE "TelegramMessage" SET undone=true WHERE id=$1::uuid AND "userId"=$2::uuid',row.id,owner);await audit(tx,owner,'undo');return {reply:'Undone: your last unchanged Telegram-created record was removed.'};
 }
 if(['tasks','notes','projects'].includes(name)){
   const table={tasks:'Task',notes:'Note',projects:'Project'}[name as 'tasks'|'notes'|'projects'];
   const rows=await tx.$queryRawUnsafe<{title:string;detail:string}[]>(`SELECT title,${table==='Note'?'left(content,250)':'status'} AS detail FROM "${table}" WHERE "userId"=$1::uuid AND title ILIKE $2 ORDER BY "updatedAt" DESC,id LIMIT 5`,owner,`%${args.slice(0,100).replace(/[\\%_]/g,'\\$&')}%`);
   return {reply:rows.length?rows.map(r=>r.title+' — '+r.detail).join('\n')+'\nLatest five matching records. Open PLUTO for the complete list.':'No matching records.'};
 }
 if(name==='balance'){
   const balances=await tx.$queryRawUnsafe<{currency:string;balance:bigint}[]>(`SELECT a.currency,sum(a."openingBalance"+COALESCE(t.net,0))::bigint AS balance FROM "FinancialAccount" a LEFT JOIN (SELECT t."accountId",t."userId",sum(CASE WHEN c.kind='income' THEN t.amount ELSE -t.amount END) AS net FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" WHERE t."userId"=$1::uuid GROUP BY t."accountId",t."userId") t ON t."accountId"=a.id AND t."userId"=a."userId" WHERE a."userId"=$1::uuid GROUP BY a.currency ORDER BY a.currency`,owner);
   return {reply:balances.length?'Manual account balances:\n'+balances.map(r=>formatMoney(r.balance,r.currency)).join('\n'):'No financial accounts recorded.'};
 }
 let outcome:Omit<Outcome,'reply'>;
 if(name==='task'){requireParts(parts,2,3);outcome=await insert(tx,owner,'Task',{title:parts[0],dueDate:parts[1],priority:parts[2]??'normal',status:'planned'});}
 else if(name==='note'){requireParts(parts,2,3);outcome=await insert(tx,owner,'Note',{title:parts[0],content:parts[1],tag:parts[2]??'telegram'});}
 else if(name==='idea'){requireParts(parts,2);outcome=await insert(tx,owner,'Note',{title:parts[0],content:parts[1],tag:'project-idea'});}
 else if(name==='remind'){requireParts(parts,3);const taskId=await exactParent(tx,owner,'Task',parts[0]);outcome=await insert(tx,owner,'Reminder',{title:('Reminder: '+parts[0]).slice(0,200),taskId,dueDate:parts[1],time:parts[2]});}
 else if(name==='expense'||name==='income'){requireParts(parts,5);const accountId=await exactParent(tx,owner,'FinancialAccount',parts[1]);const categoryId=await exactParent(tx,owner,'Category',parts[2],name);outcome=await insert(tx,owner,'Transaction',{title:parts[3],amount:parts[0],accountId,categoryId,date:parts[4]});}
 else return {reply:'Use +400 for income, -20 food for spending, or /help for more commands.'};
 await audit(tx,owner,'create.'+outcome.entity);return {...outcome,reply:`Saved ${outcome.entity==='Transaction'?name:outcome.entity?.toLowerCase()} successfully.${name==='remind'?' Reminder stored; delivery follows Notification Center settings and a running worker.':''} Use /undo to remove it if unchanged.`};
}
async function audit(tx:Tx,ownerId:string,action:string){await tx.$executeRawUnsafe('INSERT INTO "AuditLog"(id,"userId",action,outcome) VALUES($1::uuid,$2::uuid,$3,\'success\')',randomUUID(),ownerId,'telegram.'+action)}
export async function processUpdate(input:unknown,config:TelegramConfig){
 const update=approvedUpdate(input,config);if(!update)return {accepted:false};
 return withBotDatabase(config,async tx=>{
   await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',config.ownerId+':telegram');
   const exists=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "TelegramMessage" WHERE "userId"=$1::uuid AND "botId"=$2 AND "updateId"=$3',config.ownerId,config.botId,BigInt(update.update_id));if(exists.length)return {accepted:true,duplicate:true};
   const recent=await tx.$queryRawUnsafe<{count:bigint}[]>('SELECT count(*) FROM "TelegramMessage" WHERE "userId"=$1::uuid AND "createdAt">now()-interval \'1 minute\'',config.ownerId);if(Number(recent[0].count)>=60)throw Error('Rate limited');
   // Savepoints preserve a usable transaction when undo is blocked by a dependent record.
   await tx.$executeRawUnsafe('SAVEPOINT telegram_command');let result:Outcome;
   try{result=await execute(tx,config,update.message.text,update.update_id);}
   catch(error){if(error instanceof CommandError){await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT telegram_command');result={reply:error.message};}else if(typeof error==='object'&&error!==null&&(('code' in error&&error.code==='23503')||('meta' in error&&typeof error.meta==='object'&&error.meta!==null&&'code' in error.meta&&error.meta.code==='23503'))){await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT telegram_command');result={reply:'A linked record prevents this operation. Remove its dependents in PLUTO first. Nothing was changed.'};}else throw error;}
   await tx.$executeRawUnsafe('RELEASE SAVEPOINT telegram_command');
   await tx.$executeRawUnsafe('INSERT INTO "TelegramMessage"(id,"userId","botId","updateId",command,reply,entity,"recordId","recordVersion")VALUES($1::uuid,$2::uuid,$3,$4,$5,$6,$7,$8::uuid,$9)',randomUUID(),config.ownerId,config.botId,BigInt(update.update_id),parseCommand(update.message.text).name,result.reply.slice(0,4096),result.entity??null,result.recordId??null,result.recordVersion??null);
   return {accepted:true,duplicate:false};
 });
}
export async function flushReplies(config:TelegramConfig,send:(config:TelegramConfig,text:string)=>Promise<unknown>=sendReply){
 for(let i=0;i<5;i++){
 const claimed=await withBotDatabase(config,async tx=>{
   // A changed allowlist or owner disconnect also stops pending private replies.
   const valid=await tx.$queryRawUnsafe<{id:string}[]>('SELECT "userId" AS id FROM "TelegramIdentity" WHERE "userId"=$1::uuid AND "botId"=$2 AND "telegramUserId"=$3 AND "chatId"=$4',config.ownerId,config.botId,config.userId,config.chatId);if(!valid.length)return null;
   const rows=await tx.$queryRawUnsafe<{id:string;reply:string}[]>('SELECT id,reply FROM "TelegramMessage" WHERE "userId"=$1::uuid AND "botId"=$2 AND "deliveredAt" IS NULL AND "canceledAt" IS NULL AND attempts<10 AND "nextAttemptAt"<=now() AND ("leaseUntil" IS NULL OR "leaseUntil"<now()) ORDER BY "createdAt",id LIMIT 1 FOR UPDATE SKIP LOCKED',config.ownerId,config.botId);
   if(!rows.length)return null;await tx.$executeRawUnsafe('UPDATE "TelegramMessage" SET attempts=attempts+1,"leaseUntil"=now()+interval \'60 seconds\' WHERE id=$1::uuid AND "userId"=$2::uuid',rows[0].id,config.ownerId);return rows[0];
 });if(!claimed)return;
 try{await send(config,claimed.reply);await withBotDatabase(config,tx=>tx.$executeRawUnsafe('UPDATE "TelegramMessage" SET "deliveredAt"=now(),"leaseUntil"=NULL WHERE id=$1::uuid AND "userId"=$2::uuid',claimed.id,config.ownerId));}
 catch(error){const delay=error instanceof TelegramDeliveryError?error.retryAfter:30;await withBotDatabase(config,tx=>tx.$executeRawUnsafe('UPDATE "TelegramMessage" SET "leaseUntil"=NULL,"nextAttemptAt"=now()+($3::int * interval \'1 second\') WHERE id=$1::uuid AND "userId"=$2::uuid',claimed.id,config.ownerId,delay));return;}
 }
}
