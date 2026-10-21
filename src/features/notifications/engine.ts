import {randomUUID} from 'node:crypto';
import type {Prisma} from '@prisma/client';
import {analyze} from '@/features/assistant/analysis';
import {storeReferences} from '@/features/assistant/storage';
import {formatMoney} from '@/features/tracking/config';
import {enabled,localClock,scheduledSlots,shiftDay,type Settings,type Kind} from './schedule';
import {storedRuleSettings,repetitionKey} from './rules';
export type Tx=Pick<Prisma.TransactionClient,'$queryRawUnsafe'|'$executeRawUnsafe'>;
type Rule={id:string;kind:Kind;version:number;config?:unknown;thresholdMinor:bigint|null;currency:string;leadDays:number;time:string;lastScannedAt:Date|null;createdAt:Date};
export type Payload={title:string;text:string;href:string;asOf:string;sourceUpdatedAt:string;coverage:string};
export async function readSettings(tx:Tx,owner:string){const rows=await tx.$queryRawUnsafe<(Settings&{updatedAt:Date})[]>('SELECT * FROM "UserSettings" WHERE "userId"=$1::uuid',owner);if(!rows[0])throw Error('Account settings unavailable');return rows[0];}
const sourceKey=(entity:string,id:string,updatedAt:Date)=>`${entity}:${id}:${updatedAt.toISOString()}`;
async function notifiedSources(tx:Tx,owner:string,rows:{entity:string;id:string;updatedAt:Date}[]){
 if(!rows.length)return new Set<string>();
 const sent=await tx.$queryRawUnsafe<{entity:string;id:string;updatedAt:string}[]>(`SELECT DISTINCT s.entity,s.id,s."updatedAt" FROM jsonb_to_recordset($2::jsonb) AS s(entity text,id text,"updatedAt" text) JOIN "NotificationJob" j ON j."userId"=$1::uuid AND j.entity=s.entity AND j."recordId"::text=s.id AND j.payload->>'sourceUpdatedAt'=s."updatedAt" WHERE j.status<>'canceled'`,owner,JSON.stringify(rows.map(r=>({...r,updatedAt:r.updatedAt.toISOString()}))));
 return new Set(sent.map(r=>`${r.entity}:${r.id}:${r.updatedAt}`));
}
export async function scheduleNotifications(tx:Tx,owner:string,now=new Date()){
 await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',owner+':notifications');
 const settings=await readSettings(tx,owner);
 await tx.$executeRawUnsafe(`INSERT INTO "NotificationRule"("userId",kind)SELECT $1::uuid,kind FROM unnest(ARRAY['weekly','deadline','financial','morning','reminder']) kind ON CONFLICT("userId",kind) DO NOTHING`,owner);
 const rules=await tx.$queryRawUnsafe<Rule[]>('SELECT * FROM "NotificationRule" WHERE "userId"=$1::uuid ORDER BY kind',owner),clock=localClock(now,settings.timezone),policies=storedRuleSettings(settings,rules);
 const planned:Record<string,unknown>[]=[];
 const queue=(rule:Rule,key:string,payload:Payload,scheduledAt:Date,entity?:string,recordId?:string,dueDate?:string)=>{
 planned.push({id:randomUUID(),ruleId:rule.id,ruleVersion:rule.version,dedupeKey:key,payload,status:settings.notificationTelegramEnabled&&policies[rule.kind].telegram?'queued':'delivered',scheduledAt:scheduledAt.toISOString(),nextAttemptAt:now.toISOString(),expiresAt:new Date(now.getTime()+86400000).toISOString(),entity:entity??null,recordId:recordId??null,dueDate:dueDate??null});
 };
 for(const rule of rules){
 if(!enabled(rule.kind,settings)||(rule.kind==='reminder'&&!policies.reminder.enabled))continue;
 if(rule.kind==='weekly'||rule.kind==='morning'){
 for(const slot of scheduledSlots(rule.kind,settings,rule.lastScannedAt??rule.createdAt,now,policies[rule.kind],rule.createdAt)){
 const key=`${rule.kind}:${rule.version}:${slot.date}`;const exists=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "NotificationJob" WHERE "userId"=$1::uuid AND "dedupeKey"=$2',owner,key);if(exists.length)continue;
 const query={domain:rule.kind==='weekly'?'weekly' as const:'calendar' as const,search:'',start:rule.kind==='weekly'?shiftDay(slot.date,-6):slot.date,end:slot.date,view:'summary' as const,recommendations:false};const answer=await analyze(tx,owner,query,now),conversation=randomUUID();
 await tx.$executeRawUnsafe('INSERT INTO "AiConversation"(id,"userId",question,query,answer,status)VALUES($1::uuid,$2::uuid,$3,$4::jsonb,$5::jsonb,\'complete\')',conversation,owner,`${rule.kind==='weekly'?'Scheduled review':'Scheduled briefing'} ${slot.date}`,JSON.stringify(query),JSON.stringify(answer));await storeReferences(tx,owner,conversation,answer.sources);
 queue(rule,key,{title:`${rule.kind==='weekly'?'Review':'Briefing'} · ${slot.date}`,text:answer.claims.slice(0,2).map(c=>c.text).join('\n').slice(0,1000),href:'/assistant',asOf:now.toISOString(),sourceUpdatedAt:answer.asOf,coverage:`${answer.claims.length} result(s); sources and coverage in Assistant history. Review covers seven calendar days; briefing covers today. Unsynced data unknown.`},slot.at);
 }
 }
 if(rule.kind==='deadline'){
 const policy=policies.deadline;
 const candidates=await tx.$queryRawUnsafe<{entity:string;id:string;title:string;dueDate:Date;updatedAt:Date}[]>([...policy.entities.map(table=>`SELECT '${table}' AS entity,id,title,"dueDate","updatedAt" FROM "${table}" WHERE "userId"=$1::uuid AND status<>'done' AND "dueDate" BETWEEN $2::date AND ($2::date+$3::int)`),...(policy.entities.includes('Assignment')?[`SELECT 'ExternalRecord' AS entity,e.id,e.payload->>'title' AS title,CASE WHEN length(e.payload->>'dueAt')=10 THEN (e.payload->>'dueAt')::date ELSE ((e.payload->>'dueAt')::timestamptz AT TIME ZONE $4)::date END AS "dueDate",e."sourceUpdatedAt" AS "updatedAt" FROM "ExternalRecord" e JOIN "ApiConnection" c ON c.id=e."connectionId" AND c."userId"=e."userId" WHERE e."userId"=$1::uuid AND NOT e.deleted AND e.kind='Assignment' AND c.provider='canvas' AND c.mode='live' AND c.status='healthy' AND c.selection->>'canvasTransport'='feed' AND CASE WHEN length(e.payload->>'dueAt')=10 THEN (e.payload->>'dueAt')::date ELSE ((e.payload->>'dueAt')::timestamptz AT TIME ZONE $4)::date END BETWEEN $2::date AND ($2::date+$3::int)`]:[])].join(' UNION ALL ')+' ORDER BY "dueDate",id LIMIT 201',...[owner,clock.date,rule.leadDays,...(policy.entities.includes('Assignment')?[settings.timezone]:[])]);
 const sent=policy.repeat==='once'?await notifiedSources(tx,owner,candidates):new Set<string>();
 if(clock.time>=rule.time)for(const row of candidates.slice(0,200)){
 const date=row.dueDate.toISOString().slice(0,10);if(sent.has(sourceKey(row.entity,row.id,row.updatedAt)))continue;
 const period=repetitionKey(policy,clock.date,clock.time,shiftDay(date,-rule.leadDays),rule.time);
 queue(rule,`deadline:${sourceKey(row.entity,row.id,row.updatedAt)}:${period}`,{title:'Upcoming deadline',text:`${row.title.slice(0,160)} — ${row.entity==='ExternalRecord'?'Canvas assignment':row.entity}, due ${date}.`,href:row.entity==='ExternalRecord'?'/settings':['Assignment','Exam'].includes(row.entity)?'/education':row.entity==='Milestone'?'/projects':row.entity==='FollowUp'?'/career':'/calendar',asOf:now.toISOString(),sourceUpdatedAt:row.updatedAt.toISOString(),coverage:row.entity==='ExternalRecord'?'Canvas calendar snapshot; completion and grades unknown. Sync freshness is shown in Integrations. Stops after due date, deletion or disconnect.':'Selected recorded deadlines only; at most 200 per scan. Stops when completed or past due. Source checked before delivery.'},now,row.entity,row.id,date);
 }
 }
 if(rule.kind==='reminder'){
 const policy=policies.reminder;
 const reminders=await tx.$queryRawUnsafe<{id:string;title:string;dueDate:Date;time:string;updatedAt:Date}[]>(`SELECT r.id,r.title,r."dueDate",r.time,r."updatedAt" FROM "Reminder" r JOIN "Task" t ON t.id=r."taskId" AND t."userId"=r."userId" WHERE r."userId"=$1::uuid AND t.status<>'done' AND r."dueDate"<=$2::date AND ($4::boolean OR r."dueDate">=($2::date-7)) AND (r."dueDate"<$2::date OR r.time<=$3) ORDER BY r."dueDate",r.time,r.id LIMIT 200`,owner,clock.date,clock.time,policy.repeat!=='once');
 const sent=policy.repeat==='once'?await notifiedSources(tx,owner,reminders.map(r=>({...r,entity:'Reminder'}))):new Set<string>();
 for(const row of reminders){const date=row.dueDate.toISOString().slice(0,10);if(policy.repeat==='daily'&&clock.time<row.time)continue;if(sent.has(sourceKey('Reminder',row.id,row.updatedAt)))continue;
 const period=repetitionKey(policy,clock.date,clock.time,date,row.time);
 queue(rule,`reminder:${row.id}:${row.updatedAt.toISOString()}:${period}`,{title:'Stored reminder',text:`${row.title.slice(0,160)} — ${date} ${row.time} ${settings.timezone}.`,href:'/calendar',asOf:now.toISOString(),sourceUpdatedAt:row.updatedAt.toISOString(),coverage:'Owner-stored reminder; repeats until its task is completed. One-time reminders catch up at most seven days. At most 200 candidates per scan.'},now,'Reminder',row.id,date);
 }
 }
 if(rule.kind==='financial'&&rule.thresholdMinor){
 const policy=policies.financial;
 const rows=await tx.$queryRawUnsafe<{spent:string;latest:Date|null}[]>(`SELECT COALESCE(sum(t.amount),0)::text AS spent,max(t."updatedAt") AS latest FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" JOIN "FinancialAccount" a ON a.id=t."accountId" AND a."userId"=t."userId" WHERE t."userId"=$1::uuid AND c.kind='expense' AND t."transferGroup" IS NULL AND a.currency=$2 AND t.date BETWEEN $3::date AND $4::date`,owner,rule.currency,clock.date.slice(0,7)+'-01',clock.date);
 const period=repetitionKey(policy,clock.date,clock.time,clock.date.slice(0,7)+'-01',policy.time);
 const legacy=policy.repeat==='once'?await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "NotificationJob" WHERE "userId"=$1::uuid AND "dedupeKey"=$2 AND status<>\'canceled\' LIMIT 1',owner,`financial:${rule.version}:${rule.currency}:${clock.date.slice(0,7)}`):[];
 if(!legacy.length&&clock.time>=policy.time&&BigInt(rows[0].spent)>=rule.thresholdMinor)queue(rule,`financial:${rule.currency}:${clock.date.slice(0,7)}:${rule.thresholdMinor}:${period}`,{title:'Recorded monthly expense threshold',text:`${formatMoney(BigInt(rows[0].spent),rule.currency)} recorded expenses this month reached your ${formatMoney(rule.thresholdMinor,rule.currency)} threshold.`,href:'/finances',asOf:now.toISOString(),sourceUpdatedAt:rows[0].latest?.toISOString()??now.toISOString(),coverage:'Recorded expenses only, by selected currency and current month. Repeats at your chosen frequency while at or above the threshold.'},now);
 }
 await tx.$executeRawUnsafe('UPDATE "NotificationRule" SET "lastScannedAt"=$3 WHERE id=$1::uuid AND "userId"=$2::uuid',rule.id,owner,now);
 }
 if(!planned.length)return 0;
 const unique=[...new Map(planned.map(job=>[job.dedupeKey,job])).values()];
 return tx.$executeRawUnsafe(`WITH inserted AS(INSERT INTO "NotificationJob"(id,"userId","ruleId","ruleVersion","dedupeKey",payload,status,"scheduledAt","nextAttemptAt","expiresAt",entity,"recordId","dueDate") SELECT j.id,$1::uuid,j."ruleId",j."ruleVersion",j."dedupeKey",j.payload,j.status,j."scheduledAt",j."nextAttemptAt",j."expiresAt",j.entity,j."recordId",j."dueDate" FROM jsonb_to_recordset($2::jsonb) AS j(id uuid,"ruleId" uuid,"ruleVersion" int,"dedupeKey" text,payload jsonb,status text,"scheduledAt" timestamptz,"nextAttemptAt" timestamptz,"expiresAt" timestamptz,entity text,"recordId" uuid,"dueDate" date) ON CONFLICT("userId","dedupeKey") DO NOTHING RETURNING id) INSERT INTO "NotificationDelivery"(id,"userId","jobId",channel,attempt,outcome)SELECT gen_random_uuid(),$1::uuid,id,'in_app',0,'delivered' FROM inserted`,owner,JSON.stringify(unique));
}
export async function jobStillValid(tx:Tx,owner:string,job:{ruleId:string;ruleVersion:number;entity:string|null;recordId:string|null;dueDate:Date|null;payload:Payload},settings:Settings,now=new Date()){
 const rows=await tx.$queryRawUnsafe<Rule[]>('SELECT * FROM "NotificationRule" WHERE id=$1::uuid AND "userId"=$2::uuid',job.ruleId,owner),rule=rows[0];
 if(!rule||rule.version!==job.ruleVersion||!enabled(rule.kind,settings))return false;
 const policy=storedRuleSettings(settings,rows)[rule.kind];if(!policy.telegram||(rule.kind==='reminder'&&!('enabled' in policy&&policy.enabled)))return false;
 if(rule.kind==='financial'){
 if(!rule.thresholdMinor||localClock(new Date(job.payload.asOf),settings.timezone).date.slice(0,7)!==localClock(now,settings.timezone).date.slice(0,7))return false;
 const date=localClock(now,settings.timezone).date;
 const sums=await tx.$queryRawUnsafe<{spent:string}[]>(`SELECT COALESCE(sum(t.amount),0)::text AS spent FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" JOIN "FinancialAccount" a ON a.id=t."accountId" AND a."userId"=t."userId" WHERE t."userId"=$1::uuid AND c.kind='expense' AND t."transferGroup" IS NULL AND a.currency=$2 AND t.date BETWEEN $3::date AND $4::date`,owner,rule.currency,date.slice(0,7)+'-01',date);
 if(BigInt(sums[0].spent)<rule.thresholdMinor)return false;
 }
 if(job.entity==='ExternalRecord'){
 if(rule.kind!=='deadline'||!('entities' in policy)||!policy.entities.includes('Assignment'))return false;
 const sources=await tx.$queryRawUnsafe<{dueDate:Date;updatedAt:Date}[]>(`SELECT CASE WHEN length(e.payload->>'dueAt')=10 THEN (e.payload->>'dueAt')::date ELSE ((e.payload->>'dueAt')::timestamptz AT TIME ZONE $3)::date END AS "dueDate",e."sourceUpdatedAt" AS "updatedAt" FROM "ExternalRecord" e JOIN "ApiConnection" c ON c.id=e."connectionId" AND c."userId"=e."userId" WHERE e.id=$1::uuid AND e."userId"=$2::uuid AND NOT e.deleted AND e.kind='Assignment' AND c.provider='canvas' AND c.mode='live' AND c.status='healthy' AND c.selection->>'canvasTransport'='feed'`,job.recordId,owner,settings.timezone);
 const source=sources[0];return !!source&&source.dueDate.toISOString()===job.dueDate?.toISOString()&&source.dueDate.toISOString().slice(0,10)>=localClock(now,settings.timezone).date&&source.updatedAt.toISOString()===job.payload.sourceUpdatedAt;
 }
 if(job.entity){if(!['Task','Assignment','Exam','Milestone','FollowUp','Reminder'].includes(job.entity))return false;
 const source=await tx.$queryRawUnsafe<{status?:string;dueDate:Date;updatedAt:Date}[]>(job.entity==='Reminder'?`SELECT r."dueDate",r."updatedAt",t.status FROM "Reminder" r JOIN "Task" t ON t.id=r."taskId" AND t."userId"=r."userId" WHERE r.id=$1::uuid AND r."userId"=$2::uuid`:`SELECT status,"dueDate","updatedAt" FROM "${job.entity}" WHERE id=$1::uuid AND "userId"=$2::uuid`,job.recordId,owner);
 if(job.entity!=='Reminder'&&source[0]&&source[0].dueDate.toISOString().slice(0,10)<localClock(now,settings.timezone).date)return false;
 if(!source[0]||source[0].status==='done'||source[0].dueDate.toISOString()!==job.dueDate?.toISOString()||source[0].updatedAt.toISOString()!==job.payload.sourceUpdatedAt)return false;
 }return true;
}
