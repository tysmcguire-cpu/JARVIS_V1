import 'server-only';
import {z} from 'zod';
import {withOwnerDatabase} from '@/lib/owner-db';
import {bankAvailability} from './config';
export async function bankState(){return withOwnerDatabase(async(tx,owner)=>{
 const rows=await tx.$queryRawUnsafe<{status:string;selection:{connected?:boolean;historyStatus?:string;syncMinutes?:number;historyDays?:number;errorCode?:string};lastSyncAt:Date|null;retryAt:Date|null}[]>('SELECT status,selection,"lastSyncAt","retryAt" FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider=\'plaid\' AND mode=\'live\'',owner);
 const row=rows[0];return {...bankAvailability(),status:row?.status??'not connected',connected:!!row?.selection.connected&&row.status!=='disconnected',historyStatus:row?.selection.historyStatus??'Not yet downloaded',syncMinutes:row?.selection.syncMinutes??360,historyDays:row?.selection.historyDays??730,lastSyncAt:row?.lastSyncAt?.toISOString()??null,retryAt:row?.retryAt?.toISOString()??null,errorCode:row?.selection.errorCode??null};
})}
export const historyQuery=z.object({page:z.number().int().min(1).max(100000).default(1),search:z.string().max(100).default(''),accountId:z.string().max(150).default(''),status:z.enum(['','pending','posted']).default(''),start:z.union([z.literal(''),z.iso.date()]).default(''),end:z.union([z.literal(''),z.iso.date()]).default('')}).strict().refine(q=>!q.start||!q.end||q.start<=q.end);
export async function bankHistory(input:unknown){const query=historyQuery.parse(input);return withOwnerDatabase(async(tx,owner)=>{
 const accounts=await tx.$queryRawUnsafe<{payload:Record<string,string>;fetchedAt:Date}[]>(`SELECT e.payload,e."fetchedAt" FROM "ExternalRecord" e JOIN "ApiConnection" c ON c.id=e."connectionId" AND c."userId"=e."userId" WHERE e."userId"=$1::uuid AND c.provider='plaid' AND c.mode='live' AND c.status<>'disconnected' AND c.selection->>'connected'='true' AND c.selection->>'environment'=$2 AND NOT e.deleted AND e.kind='BankAccount' ORDER BY e.payload->>'title',e.id`,owner,process.env.PLAID_ENV??'sandbox');
 const params:unknown[]=[owner,process.env.PLAID_ENV??'sandbox'];let where=`e."userId"=$1::uuid AND c.provider='plaid' AND c.mode='live' AND c.status<>'disconnected' AND c.selection->>'connected'='true' AND c.selection->>'environment'=$2 AND NOT e.deleted AND e.kind='BankTransaction'`;
 const bind=(v:unknown)=>{params.push(v);return '$'+params.length};
 if(query.search)where+=` AND (e.payload->>'title' ILIKE ${bind('%'+query.search.replace(/[\\%_]/g,'\\$&')+'%')} OR e.payload->>'merchant' ILIKE $${params.length})`;
 if(query.accountId)where+=` AND e.payload->>'accountId'=${bind(query.accountId)}`;if(query.status)where+=` AND e.payload->>'status'=${bind(query.status)}`;if(query.start)where+=` AND e.payload->>'date'>=${bind(query.start)}`;if(query.end)where+=` AND e.payload->>'date'<=${bind(query.end)}`;
 const [{total}]=await tx.$queryRawUnsafe<{total:bigint}[]>(`SELECT count(*) AS total FROM "ExternalRecord" e JOIN "ApiConnection" c ON c.id=e."connectionId" AND c."userId"=e."userId" WHERE ${where}`,...params);
 const page=Math.min(query.page,Math.max(1,Math.ceil(Number(total)/4)));
 const rows=await tx.$queryRawUnsafe<{id:string;payload:Record<string,string>;fetchedAt:Date}[]>(`SELECT e.id,e.payload,e."fetchedAt" FROM "ExternalRecord" e JOIN "ApiConnection" c ON c.id=e."connectionId" AND c."userId"=e."userId" WHERE ${where} ORDER BY e.payload->>'date' DESC,e.id LIMIT 4 OFFSET ${bind((page-1)*4)}`,...params);
 return {total:Number(total),page,accounts:accounts.map(a=>({...a.payload,fetchedAt:a.fetchedAt.toISOString()} as Record<string,string>)),rows:rows.map(r=>({id:r.id,...r.payload,fetchedAt:r.fetchedAt.toISOString()} as {id:string;[key:string]:string}))};
})}
