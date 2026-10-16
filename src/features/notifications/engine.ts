import {randomUUID} from 'node:crypto';
import type {Prisma} from '@prisma/client';
import {analyze} from '@/features/assistant/analysis';
import {storeReferences} from '@/features/assistant/storage';
import {formatMoney} from '@/features/tracking/config';
import {enabled,localClock,scheduledSlots,shiftDay,type Settings,type Kind} from './schedule';
export type Tx=Pick<Prisma.TransactionClient,'$queryRawUnsafe'|'$executeRawUnsafe'>;
type Rule={id:string;kind:Kind;version:number;thresholdMinor:bigint|null;currency:string;leadDays:number;time:string;lastScannedAt:Date|null;createdAt:Date};
export type Payload={title:string;text:string;href:string;asOf:string;sourceUpdatedAt:string;coverage:string};
export async function readSettings(tx:Tx,owner:string){const rows=await tx.$queryRawUnsafe<(Settings&{updatedAt:Date})[]>('SELECT * FROM "UserSettings" WHERE "userId"=$1::uuid',owner);if(!rows[0])throw Error('Owner settings unavailable');return rows[0];}
export async function scheduleNotifications(tx:Tx,owner:string,now=new Date()){
 await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',owner+':notifications');
 const settings=await readSettings(tx,owner);await tx.$executeRawUnsafe(`INSERT INTO "NotificationRule"("userId",kind)SELECT $1::uuid,kind FROM unnest(ARRAY['weekly','deadline','financial','morning']) kind ON CONFLICT("userId",kind) DO NOTHING`,owner);
 const rules=await tx.$queryRawUnsafe<Rule[]>('SELECT * FROM "NotificationRule" WHERE "userId"=$1::uuid ORDER BY kind',owner),clock=localClock(now,settings.timezone);
 const planned:Record<string,unknown>[]=[];
 const queue=async(rule:Rule,key:string,payload:Payload,scheduledAt:Date,entity?:string,recordId?:string,dueDate?:string)=>{
 planned.push({id:randomUUID(),ruleId:rule.id,ruleVersion:rule.version,dedupeKey:key,payload,status:settings.notificationTelegramEnabled?'queued':'delivered',scheduledAt:scheduledAt.toISOString(),nextAttemptAt:now.toISOString(),expiresAt:new Date(now.getTime()+86400000).toISOString(),entity:entity??null,recordId:recordId??null,dueDate:dueDate??null});
 };
 for(const rule of rules){
 if(!enabled(rule.kind,settings))continue;
 if(rule.kind==='weekly'||rule.kind==='morning'){
 for(const slot of scheduledSlots(rule.kind,settings,rule.lastScannedAt??rule.createdAt,now)){
 const key=`${rule.kind}:${rule.version}:${slot.date}`;const exists=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "NotificationJob" WHERE "userId"=$1::uuid AND "dedupeKey"=$2',owner,key);if(exists.length)continue;
 const query={domain:rule.kind==='weekly'?'weekly' as const:'calendar' as const,search:'',start:rule.kind==='weekly'?shiftDay(slot.date,-6):slot.date,end:slot.date,view:'summary' as const,recommendations:false};const answer=await analyze(tx,owner,query,now),conversation=randomUUID();
 await tx.$executeRawUnsafe('INSERT INTO "AiConversation"(id,"userId",question,query,answer,status)VALUES($1::uuid,$2::uuid,$3,$4::jsonb,$5::jsonb,\'complete\')',conversation,owner,`${rule.kind==='weekly'?'Scheduled weekly review':'Scheduled morning briefing'} ${slot.date}`,JSON.stringify(query),JSON.stringify(answer));await storeReferences(tx,owner,conversation,answer.sources);
 await queue(rule,key,{title:`${rule.kind==='weekly'?'Weekly review':'Morning briefing'} · ${slot.date}`,text:answer.claims.slice(0,2).map(c=>c.text).join('\n').slice(0,1000),href:'/assistant',asOf:now.toISOString(),sourceUpdatedAt:answer.asOf,coverage:`${answer.claims.length} result(s); full sources and coverage in Assistant history. Stored records only, unsynced data unknown.`},slot.at);
 }
 }
 if(rule.kind==='deadline'){
 const tables=['Task','Assignment','Exam','Milestone','FollowUp'];
 const candidates=await tx.$queryRawUnsafe<{entity:string;id:string;title:string;dueDate:Date;updatedAt:Date}[]>(tables.map(table=>`SELECT '${table}' AS entity,id,title,"dueDate","updatedAt" FROM "${table}" WHERE "userId"=$1::uuid AND status<>'done' AND "dueDate" BETWEEN $2::date AND ($2::date+$3::int)`).join(' UNION ALL ')+' ORDER BY "dueDate",id LIMIT 201',owner,clock.date,rule.leadDays);
 if(clock.time>=rule.time)for(const row of candidates.slice(0,200)){const date=row.dueDate.toISOString().slice(0,10);await queue(rule,`deadline:${rule.version}:${row.entity}:${row.id}:${date}:${row.updatedAt.toISOString()}`,{title:'Upcoming deadline',text:`${row.title.slice(0,160)} — ${row.entity}, due ${date}.`,href:['Assignment','Exam'].includes(row.entity)?'/education':row.entity==='Milestone'?'/projects':row.entity==='FollowUp'?'/career':'/calendar',asOf:now.toISOString(),sourceUpdatedAt:row.updatedAt.toISOString(),coverage:'Recorded manual deadlines only; at most 200 candidates per scan. Changed/completed records are checked before Telegram delivery.'},now,row.entity,row.id,date)}
 const reminders=await tx.$queryRawUnsafe<{id:string;title:string;dueDate:Date;time:string;updatedAt:Date}[]>(`SELECT r.id,r.title,r."dueDate",r.time,r."updatedAt" FROM "Reminder" r JOIN "Task" t ON t.id=r."taskId" AND t."userId"=r."userId" WHERE r."userId"=$1::uuid AND t.status<>'done' AND r."dueDate" BETWEEN ($2::date-7) AND $2::date AND (r."dueDate"<$2::date OR r.time<=$3) ORDER BY r."dueDate",r.time,r.id LIMIT 200`,owner,clock.date,clock.time);
 for(const row of reminders){const date=row.dueDate.toISOString().slice(0,10);await queue(rule,`reminder:${rule.version}:${row.id}:${date}:${row.time}:${row.updatedAt.toISOString()}`,{title:'Stored reminder',text:`${row.title.slice(0,160)} — ${date} ${row.time} ${settings.timezone}.`,href:'/calendar',asOf:now.toISOString(),sourceUpdatedAt:row.updatedAt.toISOString(),coverage:'Owner-stored reminder; up to seven days of catch-up, at most 200 candidates. Task state checked before Telegram delivery.'},now,'Reminder',row.id,date)}
 }
 if(rule.kind==='financial'&&rule.thresholdMinor){
 const rows=await tx.$queryRawUnsafe<{spent:string;latest:Date|null}[]>(`SELECT COALESCE(sum(t.amount),0)::text AS spent,max(t."updatedAt") AS latest FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" JOIN "FinancialAccount" a ON a.id=t."accountId" AND a."userId"=t."userId" WHERE t."userId"=$1::uuid AND c.kind='expense' AND a.currency=$2 AND t.date BETWEEN $3::date AND $4::date`,owner,rule.currency,clock.date.slice(0,7)+'-01',clock.date);
 if(BigInt(rows[0].spent)>=rule.thresholdMinor)await queue(rule,`financial:${rule.version}:${rule.currency}:${clock.date.slice(0,7)}`,{title:'Recorded monthly expense threshold',text:`${formatMoney(BigInt(rows[0].spent),rule.currency)} recorded expenses this month reached your ${formatMoney(rule.thresholdMinor,rule.currency)} threshold.`,href:'/finances',asOf:now.toISOString(),sourceUpdatedAt:rows[0].latest?.toISOString()??now.toISOString(),coverage:'Recorded expenses only; no bank connection or currency conversion. At most one alert per currency/month/rule version.'},now);
 }
 await tx.$executeRawUnsafe('UPDATE "NotificationRule" SET "lastScannedAt"=$3 WHERE id=$1::uuid AND "userId"=$2::uuid',rule.id,owner,now);
 }
 if(!planned.length)return 0;
 const unique=[...new Map(planned.map(job=>[job.dedupeKey,job])).values()];
 return tx.$executeRawUnsafe(`WITH inserted AS(INSERT INTO "NotificationJob"(id,"userId","ruleId","ruleVersion","dedupeKey",payload,status,"scheduledAt","nextAttemptAt","expiresAt",entity,"recordId","dueDate") SELECT j.id,$1::uuid,j."ruleId",j."ruleVersion",j."dedupeKey",j.payload,j.status,j."scheduledAt",j."nextAttemptAt",j."expiresAt",j.entity,j."recordId",j."dueDate" FROM jsonb_to_recordset($2::jsonb) AS j(id uuid,"ruleId" uuid,"ruleVersion" int,"dedupeKey" text,payload jsonb,status text,"scheduledAt" timestamptz,"nextAttemptAt" timestamptz,"expiresAt" timestamptz,entity text,"recordId" uuid,"dueDate" date) ON CONFLICT("userId","dedupeKey") DO NOTHING RETURNING id) INSERT INTO "NotificationDelivery"(id,"userId","jobId",channel,attempt,outcome)SELECT gen_random_uuid(),$1::uuid,id,'in_app',0,'delivered' FROM inserted`,owner,JSON.stringify(unique));
}
export async function jobStillValid(tx:Tx,owner:string,job:{ruleId:string;ruleVersion:number;entity:string|null;recordId:string|null;dueDate:Date|null;payload:Payload},settings:Settings){
 const rows=await tx.$queryRawUnsafe<Rule[]>('SELECT * FROM "NotificationRule" WHERE id=$1::uuid AND "userId"=$2::uuid',job.ruleId,owner);if(!rows[0]||rows[0].version!==job.ruleVersion||!enabled(rows[0].kind,settings))return false;
 if(job.entity){if(!['Task','Assignment','Exam','Milestone','FollowUp','Reminder'].includes(job.entity))return false;
 const source=await tx.$queryRawUnsafe<{status?:string;dueDate:Date;updatedAt:Date}[]>(job.entity==='Reminder'?`SELECT r."dueDate",r."updatedAt",t.status FROM "Reminder" r JOIN "Task" t ON t.id=r."taskId" AND t."userId"=r."userId" WHERE r.id=$1::uuid AND r."userId"=$2::uuid`:`SELECT status,"dueDate","updatedAt" FROM "${job.entity}" WHERE id=$1::uuid AND "userId"=$2::uuid`,job.recordId,owner);if(!source[0]||source[0].status==='done'||source[0].dueDate.toISOString()!==job.dueDate?.toISOString()||source[0].updatedAt.toISOString()!==job.payload.sourceUpdatedAt)return false;
 }return true;
}
