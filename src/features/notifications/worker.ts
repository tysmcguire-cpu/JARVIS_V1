import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {db} from '@/lib/db';
import {getTelegramConfig} from '@/features/telegram/config';
import {sendReply,TelegramDeliveryError} from '@/features/telegram/transport';
import {readSettings,scheduleNotifications,jobStillValid,type Tx,type Payload} from './engine';
import {retryDelay} from './schedule';
export async function withNotificationDatabase<T>(ownerInput:string,run:(tx:Tx)=>Promise<T>){const owner=z.uuid().parse(ownerInput);return db.$transaction(async tx=>{await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${owner},true)`;const valid=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "User" WHERE id=$1::uuid AND synthetic=false',owner);if(!valid.length)throw Error('Owner unavailable');return run(tx)},{timeout:30000})}
export type Job={id:string;payload:Payload;attempts:number;maxAttempts:number;ruleId:string;ruleVersion:number;entity:string|null;recordId:string|null;dueDate:Date|null};
export async function deliverNotifications(owner:string,run:<T>(work:(tx:Tx)=>Promise<T>)=>Promise<T>,send:typeof sendReply=sendReply,now=new Date()){
 await run(tx=>tx.$executeRawUnsafe('UPDATE "NotificationJob" SET status=\'failed\',"leaseToken"=NULL,"leaseUntil"=NULL WHERE "userId"=$1::uuid AND status=\'queued\' AND attempts>="maxAttempts" AND ("leaseUntil" IS NULL OR "leaseUntil"<$2)',owner,now));
 for(let i=0;i<5;i++){
 const token=randomUUID();const claimed=await run(async tx=>{
 await tx.$executeRawUnsafe('UPDATE "NotificationJob" SET status=\'canceled\',"leaseToken"=NULL,"leaseUntil"=NULL WHERE "userId"=$1::uuid AND status=\'queued\' AND "expiresAt"<=$2',owner,now);
 const settings=await readSettings(tx,owner);if(!settings.notificationTelegramEnabled)return null;
 const rows=await tx.$queryRawUnsafe<Job[]>('SELECT * FROM "NotificationJob" WHERE "userId"=$1::uuid AND status=\'queued\' AND "nextAttemptAt"<=$2 AND ("leaseUntil" IS NULL OR "leaseUntil"<$2) AND attempts<"maxAttempts" ORDER BY "scheduledAt",id LIMIT 1 FOR UPDATE SKIP LOCKED',owner,now);const job=rows[0];if(!job)return null;
 if(!await jobStillValid(tx,owner,job,settings)){await tx.$executeRawUnsafe('UPDATE "NotificationJob" SET status=\'canceled\',"leaseToken"=NULL,"leaseUntil"=NULL WHERE id=$1::uuid AND "userId"=$2::uuid',job.id,owner);return {invalid:true as const}}
 // A crashed claim still consumes an attempt; its pending delivery records the
 // uncertain outcome. An expired final lease is explicitly exhausted below.
 await tx.$executeRawUnsafe('UPDATE "NotificationJob" SET attempts=attempts+1,"leaseToken"=$3::uuid,"leaseUntil"=$4 WHERE id=$1::uuid AND "userId"=$2::uuid',job.id,owner,token,new Date(now.getTime()+60000));await tx.$executeRawUnsafe('INSERT INTO "NotificationDelivery"(id,"userId","jobId",channel,attempt,outcome)VALUES($1::uuid,$2::uuid,$3::uuid,\'telegram\',$4,\'pending\')',randomUUID(),owner,job.id,job.attempts+1);return {job,invalid:false as const};
 });if(!claimed)return;if(claimed.invalid)continue;
 const {job}=claimed;let code:string|null=null,delay=retryDelay(job.attempts+1);
 try{const config=getTelegramConfig();if(!config||config.ownerId!==owner)throw Error('unavailable');
 const valid=await run(async tx=>{const settings=await readSettings(tx,owner);if(!settings.notificationTelegramEnabled||!await jobStillValid(tx,owner,job,settings))return false;const rows=await tx.$queryRawUnsafe<{id:string}[]>('SELECT t."userId" AS id FROM "TelegramIdentity" t JOIN "NotificationJob" j ON j."userId"=t."userId" WHERE j.id=$1::uuid AND j."userId"=$2::uuid AND j."leaseToken"=$3::uuid AND j.status=\'queued\' AND t."botId"=$4 AND t."telegramUserId"=$5 AND t."chatId"=$6 AND t."pairedAt" IS NOT NULL',job.id,owner,token,config.botId,config.userId,config.chatId);return rows.length>0});if(!valid)throw Error('unavailable');
 await send(config,`${job.payload.title}\n${job.payload.text}\n\nAs of ${job.payload.asOf}; source updated ${job.payload.sourceUpdatedAt}.\n${job.payload.coverage}\nNotification ${job.id}`.slice(0,3800));
 }catch(error){code='delivery_unavailable';if(error instanceof TelegramDeliveryError)delay=retryDelay(job.attempts+1,error.retryAfter)}
 await run(async tx=>{const changed=await tx.$executeRawUnsafe('UPDATE "NotificationJob" SET status=$4,"leaseToken"=NULL,"leaseUntil"=NULL,"nextAttemptAt"=$5 WHERE id=$1::uuid AND "userId"=$2::uuid AND "leaseToken"=$3::uuid',job.id,owner,token,code?(job.attempts+1>=job.maxAttempts?'failed':'queued'):'delivered',new Date(now.getTime()+delay*1000));if(changed)await tx.$executeRawUnsafe('UPDATE "NotificationDelivery" SET outcome=$4,code=$5 WHERE "jobId"=$1::uuid AND "userId"=$2::uuid AND channel=\'telegram\' AND attempt=$3',job.id,owner,job.attempts+1,code?'failed':'delivered',code)});
 if(code)return;
 }
}
export async function notificationTick(){if(process.env.JARVIS_NOTIFICATIONS_ENABLED!=='true')throw Error('Notifications are disabled. Explicitly enable the local worker first.');const owner=z.uuid().parse(process.env.JARVIS_OWNER_ID),run=<T>(work:(tx:Tx)=>Promise<T>)=>withNotificationDatabase(owner,work);
 await run(tx=>scheduleNotifications(tx,owner));await deliverNotifications(owner,run);
}
