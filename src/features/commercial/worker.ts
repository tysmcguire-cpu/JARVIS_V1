import 'server-only';
import {withWorkerDatabase,withWorkerCustomer} from '@/lib/worker-db';
import {features} from './flags';
import {localClock,shiftDay} from '@/features/notifications/schedule';
import {generateReport} from '@/features/intelligence/reports';
import {notificationTick} from '@/features/notifications/worker';
import {canvasFeedTick} from '@/features/integrations/canvas-feed-worker';
import {pairedBot} from '@/features/telegram/commercial';
import {flushReplies} from '@/features/telegram/service';
import {eraseAuthAccounts} from './erasure';
import {reconcileBillingTick} from '@/features/billing/worker';
export async function scheduleReports(id:string,now=new Date()){
 if(!features.weeklyReports())return;
 return withWorkerCustomer(id,async(tx,userId)=>{
  const [row]=await tx.$queryRawUnsafe<{timezone:string;reportDay:number;reportTime:string}[]>('SELECT s.timezone,p."reportDay",p."reportTime" FROM "UserSettings" s JOIN "AiPreferences" p ON p."userId"=s."userId" JOIN "Subscription" b ON b."userId"=s."userId" WHERE s."userId"=$1::uuid AND p."weeklyEnabled" AND p."sharingEnabled" AND cardinality(p."allowedDomains")>0 AND b.plan IN (\'plus\',\'pro\') AND b.status=\'active\' AND b."periodEnd">$2 AND b."syncedAt">$2-interval \'24 hours\' AND (p."updatedAt">$2-interval \'30 days\' OR EXISTS(SELECT 1 FROM "ChatThread" WHERE "userId"=$1::uuid AND "updatedAt">$2-interval \'30 days\'))',userId,now);if(!row)return;const local=localClock(now,row.timezone);if(local.weekday!==row.reportDay||local.time<row.reportTime)return;
  await tx.$executeRawUnsafe('INSERT INTO "WeeklyReport"(id,"userId","periodStart","periodEnd")VALUES(gen_random_uuid(),$1::uuid,$2::date,$3::date)ON CONFLICT("userId","periodStart")DO NOTHING',userId,shiftDay(local.date,-7),shiftDay(local.date,-1));
 });
}
async function reportsForCustomer(id:string){
 await scheduleReports(id);const run=<T>(work:Parameters<typeof withWorkerCustomer<T>>[1])=>withWorkerCustomer(id,work);
 const rows=await run((tx,userId)=>tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "WeeklyReport" WHERE "userId"=$1::uuid AND status IN (\'queued\',\'failed\',\'generating\') AND attempts<3 AND "nextAttemptAt"<=now() AND ("leaseUntil" IS NULL OR "leaseUntil"<now()) ORDER BY "periodStart" DESC LIMIT 1',userId));for(const row of rows)await generateReport(row.id,run);
 const bot=await pairedBot(id);if(!bot)return;
 await run(async(tx,userId)=>{const rows=await tx.$queryRawUnsafe<{id:string}[]>('SELECT r.id FROM "WeeklyReport" r JOIN "AiPreferences" p ON p."userId"=r."userId" WHERE r."userId"=$1::uuid AND r.status=\'completed\' AND r."notifiedAt" IS NULL AND p."telegramReports" ORDER BY r."periodStart" DESC LIMIT 1 FOR UPDATE OF r SKIP LOCKED',userId);if(!rows[0])return;const report=rows[0].id;await tx.$executeRawUnsafe('INSERT INTO "TelegramMessage"(id,"userId","botId","updateId",command,reply)VALUES($1::uuid,$2::uuid,$3,$4,\'report\',$5)ON CONFLICT(id)DO NOTHING',report,userId,bot.botId,BigInt(parseInt(report.replaceAll('-','').slice(0,12),16)),'Your Pluto weekly report is ready. Open Pluto → Assistant → Reports.');await tx.$executeRawUnsafe('UPDATE "WeeklyReport" SET "notifiedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',report,userId)});
}
export async function commercialWorkerTick(){
 if(process.env.PLUTO_WORKERS_ENABLED!=='true')throw Error('Commercial workers are disabled.');
 await withWorkerDatabase(tx=>tx.$queryRawUnsafe('SELECT public.pluto_maintenance()'));for(const task of [eraseAuthAccounts,reconcileBillingTick]){try{await task()}catch{console.error('Commercial background service unavailable. Check operator logs and configuration; private details suppressed.')}}
 const claimed=await withWorkerDatabase(tx=>tx.$queryRawUnsafe<{userId:string;token:string}[]>('SELECT * FROM public.pluto_claim_workers(2)'));
 for(const job of claimed){let ok=true;try{if(features.integrations())await canvasFeedTick(job.userId);if(process.env.PLUTO_NOTIFICATIONS_ENABLED==='true')await notificationTick(job.userId);if(features.weeklyReports())await reportsForCustomer(job.userId);const bot=await pairedBot(job.userId);if(bot)await flushReplies(bot);await withWorkerCustomer(job.userId,(tx,id)=>tx.$executeRawUnsafe('UPDATE "ChatTurn" SET status=\'failed\',"updatedAt"=now() WHERE "userId"=$1::uuid AND status=\'generating\' AND "createdAt"<now()-interval \'5 minutes\'',id))}catch{ok=false}
  await withWorkerDatabase(tx=>tx.$queryRawUnsafe('SELECT public.pluto_finish_worker($1::uuid,$2::uuid,$3)',job.userId,job.token,ok));
 }
 return claimed.length;
}
