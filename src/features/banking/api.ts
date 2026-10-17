import 'server-only';
import {z} from 'zod';
import {bankConfig} from './config';
import {parseMoney} from '@/features/tracking/config';
const endpoints=['/link/token/create','/item/public_token/exchange','/item/get','/accounts/get','/transactions/sync','/item/remove'] as const;
export class BankError extends Error{constructor(public code:string){super('Bank operation unavailable.')}}
export async function bankRequest(endpoint:typeof endpoints[number],data:Record<string,unknown>,fetcher:typeof fetch=fetch){
 const config=bankConfig();if(!endpoints.includes(endpoint))throw new BankError('ENDPOINT_REJECTED');
 let response:Response;try{response=await fetcher(config.base+endpoint,{method:'POST',headers:{'Content-Type':'application/json','PLAID-CLIENT-ID':config.clientId,'PLAID-SECRET':config.secret,'Plaid-Version':'2020-09-14'},body:JSON.stringify(data),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});}catch{throw new BankError('NETWORK_UNAVAILABLE')}
 const reader=response.body?.getReader();if(!reader)throw new BankError('INVALID_RESPONSE');const chunks:Uint8Array[]=[];let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>2097152){await reader.cancel();throw new BankError('RESPONSE_TOO_LARGE')}chunks.push(part.value)}
 let body:Record<string,unknown>;try{body=z.record(z.string(),z.unknown()).parse(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{throw new BankError('INVALID_RESPONSE')}
 if(!response.ok){const code=String(body.error_code);throw new BankError(['ITEM_LOGIN_REQUIRED','INVALID_ACCESS_TOKEN','ITEM_NOT_FOUND','PRODUCT_NOT_READY','TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION','RATE_LIMIT_EXCEEDED'].includes(code)?code:'PROVIDER_UNAVAILABLE')}
 return body;
}
const identifier=z.string().min(1).max(150),currency=z.enum(['USD','CAD','EUR','GBP']);
export function exactBankMoney(value:unknown){if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>999999999999)throw new BankError('INVALID_AMOUNT');return parseMoney(String(value))}
const nullableMoney=(value:unknown)=>value===null||value===undefined?'':exactBankMoney(value).toString();
export type BankRecord={externalId:string;kind:'BankAccount'|'BankTransaction';payload:Record<string,string>};
export function normalizeAccount(input:unknown):BankRecord{
 const raw=z.object({account_id:identifier,name:z.string().max(500),mask:z.string().regex(/^\d{2,4}$/).nullable(),type:z.enum(['depository','credit']),subtype:z.string().max(100).nullable(),balances:z.object({current:z.number().nullable(),available:z.number().nullable(),iso_currency_code:currency})}).parse(input);
 return {externalId:'account:'+raw.account_id,kind:'BankAccount',payload:{title:raw.name.slice(0,200),accountId:raw.account_id,mask:raw.mask??'',type:raw.type,subtype:raw.subtype??'',currency:raw.balances.iso_currency_code,current:nullableMoney(raw.balances.current),available:nullableMoney(raw.balances.available)}};
}
export function normalizeTransaction(input:unknown):BankRecord{
 const raw=z.object({transaction_id:identifier,account_id:identifier,date:z.iso.date(),name:z.string().max(2000),merchant_name:z.string().max(500).nullable().optional(),amount:z.number(),iso_currency_code:currency,pending:z.boolean(),pending_transaction_id:identifier.nullable().optional(),authorized_date:z.iso.date().nullable().optional(),personal_finance_category:z.object({primary:z.string().max(100),detailed:z.string().max(200),confidence_level:z.string().max(100).optional()}).nullable().optional()}).parse(input);
 const signed=-exactBankMoney(raw.amount);
 return {externalId:'txn:'+raw.transaction_id,kind:'BankTransaction',payload:{title:raw.name.slice(0,200)||'Bank transaction (description not provided)',merchant:raw.merchant_name?.slice(0,200)??'',accountId:raw.account_id,date:raw.date,authorizedDate:raw.authorized_date??'',amount:signed.toString(),currency:raw.iso_currency_code,status:raw.pending?'pending':'posted',direction:signed<0n?'outflow':signed>0n?'inflow':'zero',pendingId:raw.pending_transaction_id??'',category:raw.personal_finance_category?.detailed??'',categoryConfidence:raw.personal_finance_category?.confidence_level??''}};
}
