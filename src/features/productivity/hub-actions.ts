'use server';
import {withOwnerDatabase} from '@/lib/owner-db';
import {catalogSql} from './catalog-query';
import type {HubData,HubRow} from './hub-query';
import {z} from 'zod';
import {writeRecord} from '@/features/tracking/repository';
export async function searchEverything(input:string){const search=z.string().trim().min(1).max(100).parse(input);
 return withOwnerDatabase((tx,owner)=>tx.$queryRawUnsafe<HubRow[]>(`SELECT key,module,id,title,date,status,updated FROM (${catalogSql(undefined,true)}) catalog WHERE searchable ILIKE $2 ORDER BY updated DESC,key,id LIMIT 40`,owner,'%'+search.replace(/[\\%_]/g,'\\$&')+'%'));
}
export async function readHub():Promise<HubData>{return withOwnerDatabase(async(tx,owner)=>{
 const [{timezone,today,currency}]=await tx.$queryRawUnsafe<{timezone:string;today:string;currency:string}[]>('SELECT timezone,currency,(CURRENT_TIMESTAMP AT TIME ZONE timezone)::date::text AS today FROM "UserSettings" WHERE "userId"=$1::uuid',owner);
 const conditions:Record<string,string>={deadlines:`key IN ('Assignment','Exam','Milestone','FollowUp') AND status NOT IN ('done','submitted') AND NULLIF(date,'')::date<=$2::date+7`,tasks:`key='Task' AND status<>'done'`,schedule:`key='Event' AND NULLIF(date,'')::date<=$2::date AND COALESCE(NULLIF("endDate",'')::date,NULLIF(date,'')::date)>=$2::date`,projects:`key='Project' AND status<>'done'`,goals:`key='Goal' AND status<>'done'`,notes:`key='Note'`};
 const parts=Object.entries(conditions).flatMap(([key,where])=>[`'${key}'`,`(SELECT jsonb_build_object('total',count(*),'rows',COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM(SELECT * FROM catalog WHERE ${where} ORDER BY NULLIF(date,'') NULLS LAST,NULLIF(time,'') NULLS LAST,updated DESC,id LIMIT 6)r),'[]'::jsonb)) FROM catalog WHERE ${where})`]);
 const [{groups}]=await tx.$queryRawUnsafe<{groups:HubData['groups']}[]>(`WITH catalog AS MATERIALIZED(${catalogSql(['Assignment','Exam','Milestone','FollowUp','Task','Event','Project','Goal','Note'])}) SELECT jsonb_build_object(${parts.join(',')}) AS groups`,owner,today);
 const spending=await tx.$queryRawUnsafe<HubData['spending']>('SELECT a.currency,sum(t.amount)::text AS amount FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" JOIN "FinancialAccount" a ON a.id=t."accountId" AND a."userId"=t."userId" WHERE t."userId"=$1::uuid AND c.kind=\'expense\' AND t."transferGroup" IS NULL AND t.date>=date_trunc(\'month\',$2::date) AND t.date<=$2::date GROUP BY a.currency ORDER BY a.currency',owner,today);
 const [{total}]=await tx.$queryRawUnsafe<{total:number}[]>('SELECT count(*)::int AS total FROM "NotificationJob" WHERE "userId"=$1::uuid AND "readAt" IS NULL AND "scheduledAt"<=now() AND status<>\'canceled\'',owner);
 const notifications=await tx.$queryRawUnsafe<{id:string;title:string}[]>('SELECT id,COALESCE(payload->>\'title\',\'Notification\') AS title FROM "NotificationJob" WHERE "userId"=$1::uuid AND "readAt" IS NULL AND "scheduledAt"<=now() AND status<>\'canceled\' ORDER BY "scheduledAt" DESC,id LIMIT 2',owner);
 const dailySpending=await tx.$queryRawUnsafe<NonNullable<HubData['dailySpending']>>(`WITH totals AS (
 SELECT a.currency,t.date,sum(t.amount) AS amount FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" JOIN "FinancialAccount" a ON a.id=t."accountId" AND a."userId"=t."userId"
 WHERE t."userId"=$1::uuid AND c.kind='expense' AND t."transferGroup" IS NULL AND t.date BETWEEN $2::date-6 AND $2::date GROUP BY a.currency,t.date
 ) SELECT currencies.currency,(SELECT jsonb_agg(jsonb_build_object('date',d.day::date::text,'amount',COALESCE(t.amount,0)::text) ORDER BY d.day) FROM generate_series($2::date-6,$2::date,interval '1 day') d(day) LEFT JOIN totals t ON t.currency=currencies.currency AND t.date=d.day::date) AS days
 FROM (SELECT DISTINCT currency FROM "FinancialAccount" WHERE "userId"=$1::uuid) currencies ORDER BY currencies.currency`,owner,today);
 return {today,timezone,currency,groups,spending,dailySpending,unread:total,notifications,asOf:new Date().toISOString()};
})}
export async function quickCapture(kind:'Task'|'Note',title:string,date:string){z.enum(['Task','Note']).parse(kind);z.string().trim().min(1).max(200).parse(title);z.iso.date().parse(date);
 await writeRecord(kind,kind==='Task'?{title,dueDate:date,status:'planned',priority:'normal'}:{title,tag:'Inbox',content:''});return {ok:true};
}
