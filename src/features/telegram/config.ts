import { timingSafeEqual, createHash } from 'node:crypto';
import { z } from 'zod';
const id=z.string().regex(/^[1-9]\d{0,15}$/).refine(v=>Number.isSafeInteger(Number(v)));
const schema=z.object({TELEGRAM_ENABLED:z.literal('true'),TELEGRAM_BOT_TOKEN:z.string().regex(/^\d{5,20}:[A-Za-z0-9_-]{30,}$/),TELEGRAM_OWNER_USER_ID:id,TELEGRAM_OWNER_CHAT_ID:id,JARVIS_OWNER_ID:z.uuid()});
export type TelegramConfig={token:string;botId:string;ownerId:string;userId:string;chatId:string};
export function getTelegramConfig(env:Record<string,string|undefined>=process.env):TelegramConfig|null {
 const result=schema.safeParse(env);if(!result.success)return null;const e=result.data;
 return {token:e.TELEGRAM_BOT_TOKEN,botId:e.TELEGRAM_BOT_TOKEN.split(':')[0],ownerId:e.JARVIS_OWNER_ID,userId:e.TELEGRAM_OWNER_USER_ID,chatId:e.TELEGRAM_OWNER_CHAT_ID};
}
export function hashCode(value:string){return createHash('sha256').update(value).digest('hex')}
export function validWebhookSecret(actual:string|null,expected:string|undefined){if(!expected||!/^[A-Za-z0-9_-]{32,256}$/.test(expected)||!actual||actual.length>256)return false;const a=Buffer.from(hashCode(actual),'hex'),b=Buffer.from(hashCode(expected),'hex');return timingSafeEqual(a,b)}
const safeId=z.number().int().positive().safe();
export const updateSchema=z.object({update_id:z.number().int().nonnegative().safe(),message:z.object({message_id:safeId,from:z.object({id:safeId,is_bot:z.literal(false)}),chat:z.object({id:safeId,type:z.literal('private')}),text:z.string().min(1).max(4096),forward_origin:z.unknown().optional(),forward_date:z.unknown().optional(),via_bot:z.unknown().optional()}).optional()});
export function approvedUpdate(input:unknown,config:TelegramConfig){const parsed=updateSchema.safeParse(input);if(!parsed.success||!parsed.data.message)return null;const m=parsed.data.message;if(String(m.from.id)!==config.userId||String(m.chat.id)!==config.chatId||m.forward_origin||m.forward_date||m.via_bot)return null;return parsed.data as typeof parsed.data & {message:NonNullable<typeof parsed.data.message>}}
