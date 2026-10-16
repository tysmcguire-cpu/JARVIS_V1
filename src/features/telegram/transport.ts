import 'server-only';
import type {TelegramConfig} from './config';
export class TelegramDeliveryError extends Error {constructor(public retryAfter=30,public category:'network'|'rate_limited'|'unauthorized'|'conflict'|'provider'='provider'){super('Telegram delivery unavailable.')}}
export async function telegramRequest(config:Pick<TelegramConfig,'token'>,method:'sendMessage'|'getUpdates'|'getWebhookInfo'|'getMe',body:unknown={},signal?:AbortSignal) {
 let response:Response;try{const timeout=AbortSignal.timeout(method==='getUpdates'?40000:15000);response=await fetch(`https://api.telegram.org/bot${config.token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:signal?AbortSignal.any([timeout,signal]):timeout,cache:'no-store',redirect:'error'});}catch{throw new TelegramDeliveryError(30,'network')}
 let json:{ok?:boolean;result?:unknown;parameters?:{retry_after?:number}};try{json=await response.json()}catch{throw new TelegramDeliveryError()}
 if(!response.ok||json.ok!==true)throw new TelegramDeliveryError(Math.min(3600,Math.max(5,Number(json.parameters?.retry_after)||30)),response.status===429?'rate_limited':[401,403].includes(response.status)?'unauthorized':response.status===409?'conflict':'provider');
 return json.result;
}
export async function sendReply(config:TelegramConfig,text:string){return telegramRequest(config,'sendMessage',{chat_id:config.chatId,text:text.slice(0,4096),protect_content:true,link_preview_options:{is_disabled:true}})}
