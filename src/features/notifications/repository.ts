import 'server-only';
import {z} from 'zod';
import {withOwnerDatabase} from '@/lib/owner-db';
import {moneyInput,parseMoney} from '@/features/tracking/config';
import {preferencesSchema,type Preferences} from './schedule';
import {scheduleNotifications,type Payload} from './engine';
import type {Settings,Kind} from './schedule';
import {storedRuleSettings,type RuleSettings} from './rules';
type StoredRule={kind:string;thresholdMinor:string|null;currency:string;leadDays:number;time:string;config?:unknown};
function preferencesFrom(settings:Settings&{updatedAt:string|Date},rules:StoredRule[]):Preferences{
 const financial=rules.find(r=>r.kind==='financial'),deadline=rules.find(r=>r.kind==='deadline');
 return {timezone:settings.timezone,weeklyReviewEnabled:settings.weeklyReviewEnabled,weeklyReviewDay:settings.weeklyReviewDay,weeklyReviewTime:settings.weeklyReviewTime,deadlineReminders:settings.deadlineReminders,financialAlerts:settings.financialAlerts,morningBriefingEnabled:settings.morningBriefingEnabled,morningBriefingTime:settings.morningBriefingTime,notificationTelegramEnabled:settings.notificationTelegramEnabled,threshold:financial?.thresholdMinor?moneyInput(financial.thresholdMinor):'',currency:financial?.currency as Preferences['currency']??'USD',leadDays:deadline?.leadDays??1,deadlineTime:deadline?.time??'09:00',expectedUpdatedAt:new Date(settings.updatedAt).toISOString(),rules:storedRuleSettings(settings,rules)};
}
function revision(kind:Kind,p:Preferences,rules:RuleSettings){return JSON.stringify([p.timezone,p.notificationTelegramEnabled,rules[kind],kind==='weekly'?[p.weeklyReviewEnabled,p.weeklyReviewTime]:kind==='morning'?[p.morningBriefingEnabled,p.morningBriefingTime]:kind==='deadline'?[p.deadlineReminders,p.leadDays,p.deadlineTime]:kind==='financial'?[p.financialAlerts,p.threshold,p.currency]:[]])}
const pageSchema=z.number().int().min(1).max(10000);
export async function notificationState(pageInput:unknown=1){const page=pageSchema.parse(pageInput);return withOwnerDatabase(async(tx,owner)=>{
 const [result]=await tx.$queryRawUnsafe<{settings:(Settings&{updatedAt:string})|null;rules:StoredRule[];jobs:{id:string;payload:Payload;status:string;attempts:number;readAt:string|null;createdAt:string}[]}[]>(`SELECT (SELECT to_jsonb(s) FROM "UserSettings" s WHERE "userId"=$1::uuid) AS settings,(SELECT COALESCE(jsonb_agg(to_jsonb(r)||jsonb_build_object('thresholdMinor',r."thresholdMinor"::text)),'[]'::jsonb) FROM "NotificationRule" r WHERE "userId"=$1::uuid) AS rules,(SELECT COALESCE(jsonb_agg(to_jsonb(j) ORDER BY "createdAt" DESC,id),'[]'::jsonb) FROM(SELECT id,payload,status,attempts,"readAt","createdAt" FROM "NotificationJob" WHERE "userId"=$1::uuid ORDER BY "createdAt" DESC,id LIMIT 5 OFFSET $2::int) j) AS jobs`,owner,(page-1)*4);
 const {settings,rules,jobs}=result;if(!settings)throw Error('Owner settings unavailable');
 const prefs=preferencesFrom(settings,rules);
 return {preferences:prefs,jobs:jobs.slice(0,4).map(j=>({...j,readAt:j.readAt?new Date(j.readAt).toISOString():null,createdAt:new Date(j.createdAt).toISOString()})),more:jobs.length>4,page,workerConfigured:process.env.JARVIS_NOTIFICATIONS_ENABLED==='true'};
 })}
export async function saveNotificationPreferences(input:unknown){const prefs=preferencesSchema.parse(input);return withOwnerDatabase(async(tx,owner)=>{
 await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',owner+':notifications');
 const previous=await tx.$queryRawUnsafe<{settings:Settings&{updatedAt:string};rules:StoredRule[]}[]>(`SELECT (SELECT to_jsonb(s) FROM "UserSettings" s WHERE "userId"=$1::uuid) AS settings,(SELECT COALESCE(jsonb_agg(to_jsonb(r)||jsonb_build_object('thresholdMinor',r."thresholdMinor"::text)),'[]'::jsonb) FROM "NotificationRule" r WHERE "userId"=$1::uuid) AS rules`,owner);
 if(!previous[0]?.settings)throw Error('Owner settings unavailable');
 const changed=await tx.$executeRawUnsafe('UPDATE "UserSettings" SET timezone=$2,"weeklyReviewEnabled"=$3,"weeklyReviewDay"=$4,"weeklyReviewTime"=$5,"deadlineReminders"=$6,"financialAlerts"=$7,"morningBriefingEnabled"=$8,"morningBriefingTime"=$9,"notificationTelegramEnabled"=$10,"updatedAt"=GREATEST(date_trunc(\'milliseconds\',clock_timestamp()),"updatedAt"+interval \'1 millisecond\') WHERE "userId"=$1::uuid AND "updatedAt"=$11::timestamptz',owner,prefs.timezone,prefs.weeklyReviewEnabled,prefs.weeklyReviewDay,prefs.weeklyReviewTime,prefs.deadlineReminders,prefs.financialAlerts,prefs.morningBriefingEnabled,prefs.morningBriefingTime,prefs.notificationTelegramEnabled,prefs.expectedUpdatedAt);if(changed!==1)throw Error('Preferences changed. Reload before saving.');
 const current=preferencesFrom(previous[0].settings,previous[0].rules),oldRules=current.rules!,nextRules=prefs.rules??{...oldRules,weekly:prefs.weeklyReviewDay===current.weeklyReviewDay?oldRules.weekly:{...oldRules.weekly,days:[prefs.weeklyReviewDay]}};
 // Freeze legacy defaults before a settings change can alter their interpretation.
 const implicit=previous[0].rules.filter(r=>!r.config||JSON.stringify(r.config)==='{}').map(r=>({kind:r.kind,config:oldRules[r.kind as Kind]}));
 if(implicit.length)await tx.$executeRawUnsafe(`UPDATE "NotificationRule" r SET config=c.config FROM jsonb_to_recordset($2::jsonb) AS c(kind text,config jsonb) WHERE r."userId"=$1::uuid AND r.kind=c.kind`,owner,JSON.stringify(implicit));
 const kinds=(Object.keys(nextRules) as Kind[]).filter(kind=>revision(kind,current,oldRules)!==revision(kind,prefs,nextRules)||!previous[0].rules.some(r=>r.kind===kind));
 if(kinds.length){
 const changes=kinds.map(kind=>({kind,config:nextRules[kind],thresholdMinor:kind==='financial'&&prefs.threshold?parseMoney(prefs.threshold).toString():null,currency:prefs.currency,leadDays:prefs.leadDays,time:prefs.deadlineTime}));
 await tx.$executeRawUnsafe(`INSERT INTO "NotificationRule"("userId",kind,config,"thresholdMinor",currency,"leadDays",time,"lastScannedAt") SELECT $1::uuid,c.kind,c.config,c."thresholdMinor"::bigint,c.currency,c."leadDays",c.time,now() FROM jsonb_to_recordset($2::jsonb) AS c(kind text,config jsonb,"thresholdMinor" text,currency text,"leadDays" int,time text) ON CONFLICT("userId",kind) DO UPDATE SET version="NotificationRule".version+1,config=EXCLUDED.config,"thresholdMinor"=EXCLUDED."thresholdMinor",currency=EXCLUDED.currency,"leadDays"=EXCLUDED."leadDays",time=EXCLUDED.time,"lastScannedAt"=now()`,owner,JSON.stringify(changes));
 await tx.$executeRawUnsafe(`UPDATE "NotificationJob" SET status='canceled',"leaseToken"=NULL,"leaseUntil"=NULL WHERE "userId"=$1::uuid AND status IN('queued','failed') AND "ruleId" IN(SELECT id FROM "NotificationRule" WHERE "userId"=$1::uuid AND kind IN(SELECT jsonb_array_elements_text($2::jsonb)))`,owner,JSON.stringify(kinds));
 }
 await tx.auditLog.create({data:{userId:owner,action:'notification.preferences',outcome:'success'}});
 });}
export async function refreshNotifications(){return withOwnerDatabase((tx,owner)=>scheduleNotifications(tx,owner))}
export async function updateNotification(idInput:unknown,operation:unknown){const id=z.uuid().parse(idInput),action=z.enum(['read','retry','cancel']).parse(operation);return withOwnerDatabase(async(tx,owner)=>{
 let changed=0;
 if(action==='read')changed=await tx.$executeRawUnsafe('UPDATE "NotificationJob" SET "readAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',id,owner);
 if(action==='cancel')changed=await tx.$executeRawUnsafe('UPDATE "NotificationJob" SET status=\'canceled\',"leaseToken"=NULL,"leaseUntil"=NULL WHERE id=$1::uuid AND "userId"=$2::uuid AND status IN(\'queued\',\'failed\')',id,owner);
 if(action==='retry')changed=await tx.$executeRawUnsafe('UPDATE "NotificationJob" SET status=\'queued\',"maxAttempts"=attempts+5,"nextAttemptAt"=now(),"leaseToken"=NULL,"leaseUntil"=NULL WHERE id=$1::uuid AND "userId"=$2::uuid AND status=\'failed\' AND "expiresAt">now()',id,owner);
 if(changed)await tx.auditLog.create({data:{userId:owner,action:'notification.'+action,outcome:'success'}});
 });}
