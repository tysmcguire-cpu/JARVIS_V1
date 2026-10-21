'use server';
import { randomBytes } from 'node:crypto';
import { withCustomerDatabase } from '@/lib/customer-db';
import { requireCustomer } from '@/features/auth/server';
import { getTelegramConfig, hashCode } from './config';
export async function createTelegramPairing(){
 const owner=await requireCustomer();const config=getTelegramConfig();if(!config||config.ownerId!==owner.id)return {ok:false,code:'',message:'Configure the Telegram bot token and approved user/chat IDs locally first.'};
 const code=randomBytes(24).toString('base64url');
 try{await withCustomerDatabase(async(tx,ownerId)=>{
 await tx.$executeRawUnsafe('INSERT INTO "TelegramIdentity"("userId","botId","telegramUserId","chatId","pairingHash","pairingExpiresAt","updatedAt")VALUES($1::uuid,$2,$3,$4,$5,now()+interval \'10 minutes\',now()) ON CONFLICT("userId") DO UPDATE SET "botId"=EXCLUDED."botId","telegramUserId"=EXCLUDED."telegramUserId","chatId"=EXCLUDED."chatId","pairingHash"=EXCLUDED."pairingHash","pairingExpiresAt"=EXCLUDED."pairingExpiresAt","pairedAt"=NULL,"updatedAt"=now()',ownerId,config.botId,config.userId,config.chatId,hashCode(code));
 await tx.auditLog.create({data:{userId:ownerId,action:'telegram.pairing_requested',outcome:'success'}});
 await tx.$executeRawUnsafe('UPDATE "TelegramMessage" SET "canceledAt"=now() WHERE "userId"=$1::uuid AND "deliveredAt" IS NULL',ownerId);
 });return {ok:true,code,message:'Send this command to your bot within 10 minutes. The code is single-use.'};}catch{return {ok:false,code:'',message:'Pairing is unavailable. Check the Telegram database setup.'}}
}
export async function disconnectTelegram(){
 await requireCustomer();try{await withCustomerDatabase(async(tx,ownerId)=>{await tx.auditLog.create({data:{userId:ownerId,action:'telegram.disconnect',outcome:'success'}});await tx.$executeRawUnsafe('UPDATE "TelegramIdentity" SET "pairedAt"=NULL,"pairingHash"=NULL,"pairingExpiresAt"=NULL,"updatedAt"=now() WHERE "userId"=$1::uuid',ownerId);await tx.$executeRawUnsafe('UPDATE "TelegramMessage" SET "canceledAt"=now() WHERE "userId"=$1::uuid AND "deliveredAt" IS NULL',ownerId)});return {ok:true,message:'Telegram disconnected. Pending replies canceled.'}}catch{return {ok:false,message:'Could not disconnect. Try again.'}}
}
export async function readTelegramStatus(){
 await requireCustomer();const config=getTelegramConfig();if(!config)return {configured:false,paired:false,pending:0,paused:0};
 return withCustomerDatabase(async(tx,ownerId)=>{
 const identity=await tx.$queryRawUnsafe<{paired:boolean}[]>('SELECT "pairedAt" IS NOT NULL AS paired FROM "TelegramIdentity" WHERE "userId"=$1::uuid AND "botId"=$2 AND "telegramUserId"=$3 AND "chatId"=$4',ownerId,config.botId,config.userId,config.chatId);
 const counts=await tx.$queryRawUnsafe<{pending:bigint;paused:bigint}[]>('SELECT count(*) FILTER(WHERE attempts<10) AS pending,count(*) FILTER(WHERE attempts>=10) AS paused FROM "TelegramMessage" WHERE "userId"=$1::uuid AND "botId"=$2 AND "deliveredAt" IS NULL AND "canceledAt" IS NULL',ownerId,config.botId);
 return {configured:true,paired:identity[0]?.paired??false,pending:Number(counts[0].pending),paused:Number(counts[0].paused)};
 });
}
export async function retryTelegramReplies(){
 await requireCustomer();await withCustomerDatabase((tx,ownerId)=>tx.$executeRawUnsafe('UPDATE "TelegramMessage" SET attempts=0,"nextAttemptAt"=now() WHERE "userId"=$1::uuid AND "deliveredAt" IS NULL AND "canceledAt" IS NULL AND attempts>=10',ownerId));
}
