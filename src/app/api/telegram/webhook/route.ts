import { getTelegramConfig, validWebhookSecret } from '@/features/telegram/config';
import { flushReplies, processUpdate, withBotDatabase } from '@/features/telegram/service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const response=(status:number)=>Response.json({ok:status===200},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 const config=getTelegramConfig();if(!config||!process.env.TELEGRAM_WEBHOOK_SECRET)return response(503);
 if(!validWebhookSecret(request.headers.get('X-Telegram-Bot-Api-Secret-Token'),process.env.TELEGRAM_WEBHOOK_SECRET))return response(401);
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return response(415);
 let input:unknown;
 try{const reader=request.body?.getReader();if(!reader)return response(400);const chunks:Uint8Array[]=[];let length=0;while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>32768){await reader.cancel();return response(413)}chunks.push(part.value)}input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return response(400)}
 try{const result=await processUpdate(input,config);if(!result.accepted)return response(200);await flushReplies(config);
 const pending=await withBotDatabase(config,tx=>tx.$queryRawUnsafe<{count:bigint}[]>('SELECT count(*) FROM "TelegramMessage" WHERE "userId"=$1::uuid AND "botId"=$2 AND "updateId"=$3 AND "deliveredAt" IS NULL AND "canceledAt" IS NULL AND attempts<10',config.ownerId,config.botId,BigInt((input as {update_id:number}).update_id)));
 return response(pending[0].count>0n?503:200);
 }catch{return response(503)}
}
