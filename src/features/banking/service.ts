import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {withOwnerDatabase} from '@/lib/owner-db';
import {encryptToken,decryptToken} from '@/features/integrations/encryption';
import {bankConfig} from './config';
import {bankRequest,BankError,normalizeAccount,normalizeTransaction,type BankRecord} from './api';
export type BankRun=typeof withOwnerDatabase;
type Selection={automaticSync?:boolean;environment?:string;connected?:boolean;itemsCreated?:number;syncMinutes?:number;historyDays?:number;historyStatus?:string;completedSession?:string;errorCode?:string};
type Secret={environment:string;accessToken?:string;verified?:boolean;linkToken?:string;linkExpiry?:number;sessionId?:string;updating?:boolean};
type Row={id:string;tokenCiphertext:string|null;selection:Selection;cursor:string|null;available:boolean;retry:boolean;status:string};
const secretSchema=z.object({environment:z.enum(['sandbox','production']),accessToken:z.string().max(1000).optional(),verified:z.boolean().optional(),linkToken:z.string().max(1000).optional(),linkExpiry:z.number().optional(),sessionId:z.uuid().optional(),updating:z.boolean().optional()}).strict();
async function acquire(run:BankRun,operation:'link'|'complete'|'sync'|'disconnect',create=false){
 const token=randomUUID();
 const state=await run(async(tx,owner)=>{
  await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',owner+':plaid');
  if(operation==='link'||operation==='complete'){
   const counts=await tx.$queryRawUnsafe<{count:bigint}[]>('SELECT count(*) FROM "AuditLog" WHERE "userId"=$1::uuid AND action=$2 AND "createdAt">now()-interval \'1 hour\'',owner,'integration.bank.'+operation);
   if(Number(counts[0].count)>=(operation==='link'?5:20))throw new BankError('REQUEST_LIMIT');
   await tx.auditLog.create({data:{userId:owner,action:'integration.bank.'+operation,outcome:'success'}});
  }
  let rows=await tx.$queryRawUnsafe<Row[]>('SELECT *, ("leaseUntil" IS NULL OR "leaseUntil"<now()) AS available,("retryAt" IS NULL OR "retryAt"<=now()) AS retry FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider=\'plaid\' AND mode=\'live\' FOR UPDATE',owner);
  if(!rows.length&&create){await tx.$executeRawUnsafe('INSERT INTO "ApiConnection"(id,"userId",provider,mode,status,"consentedAt","updatedAt")VALUES($1::uuid,$2::uuid,\'plaid\',\'live\',\'authorized\',now(),now())',randomUUID(),owner);rows=await tx.$queryRawUnsafe<Row[]>('SELECT *,true AS available,true AS retry FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider=\'plaid\' AND mode=\'live\' FOR UPDATE',owner)}
  const row=rows[0];if(!row)throw new BankError('NOT_CONNECTED');if(!row.available)throw new BankError('BUSY');if(operation==='sync'&&(!row.retry||!row.selection.connected||row.status==='disconnected'))throw new BankError('RETRY_LATER');
  await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET "leaseToken"=$3::uuid,"leaseUntil"=now()+interval \'120 seconds\' WHERE id=$1::uuid AND "userId"=$2::uuid',row.id,owner,token);return {...row,owner};
 });
 const context=state.owner+':'+state.id+':plaid';
 const fenced=<T>(work:Parameters<BankRun>[0])=>run(async(tx,owner)=>{
  if(owner!==state.owner)throw new BankError('OWNER_CHANGED');const valid=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "ApiConnection" WHERE id=$1::uuid AND "userId"=$2::uuid AND "leaseToken"=$3::uuid FOR UPDATE',state.id,owner,token);if(!valid.length)throw new BankError('CONNECTION_CHANGED');await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET "leaseUntil"=now()+interval \'120 seconds\' WHERE id=$1::uuid AND "userId"=$2::uuid',state.id,owner);return work(tx,owner) as Promise<T>;
 });
 const persist=async(secret:Secret,selection:Selection,status:string,release=true)=>fenced(async(tx,owner)=>tx.$executeRawUnsafe('UPDATE "ApiConnection" SET "tokenCiphertext"=$3,selection=$4::jsonb,status=$5,"retryAt"=CASE WHEN $6 THEN NULL ELSE "retryAt" END,"consentedAt"=now(),"updatedAt"=now(),"leaseToken"=CASE WHEN $6 THEN NULL ELSE "leaseToken" END,"leaseUntil"=CASE WHEN $6 THEN NULL ELSE "leaseUntil" END WHERE id=$1::uuid AND "userId"=$2::uuid',state.id,owner,encryptToken(JSON.stringify(secret),context),JSON.stringify(selection),status,release));
 const fail=async(error:unknown)=>{try{await fenced(async(tx,owner)=>tx.$executeRawUnsafe('UPDATE "ApiConnection" SET status=\'error\',selection=jsonb_set(selection,\'{errorCode}\',to_jsonb($4::text)),"retryAt"=now()+interval \'5 minutes\',"leaseToken"=NULL,"leaseUntil"=NULL WHERE id=$1::uuid AND "userId"=$2::uuid AND "leaseToken"=$3::uuid',state.id,owner,token,error instanceof BankError?error.code:'BANK_UNAVAILABLE'))}catch{/* Expired leases recover after a host restart. */}};
 return {state,context,fenced,persist,fail,secret:()=>state.tokenCiphertext?secretSchema.parse(JSON.parse(decryptToken(state.tokenCiphertext,context))):{environment:bankConfig().env} as Secret};
}
const requireEnvironment=(secret:Secret)=>{if(secret.environment!==bankConfig().env)throw new BankError('ENVIRONMENT_CHANGED')};
export const startBankSchema=z.object({approved:z.literal(true),historyDays:z.union([z.literal(30),z.literal(90),z.literal(365),z.literal(730)]),syncMinutes:z.union([z.literal(60),z.literal(360),z.literal(1440)])}).strict();
export async function startBankLink(run:BankRun,input:unknown){
 const config=bankConfig(),choice=startBankSchema.parse(input),lease=await acquire(run,'link',true);
 try{
  const secret=lease.secret();requireEnvironment(secret);if(secret.linkToken&&secret.sessionId&&(secret.linkExpiry??0)>Date.now())return await lease.persist(secret,lease.state.selection,lease.state.status).then(()=>({token:secret.linkToken!,sessionId:secret.sessionId!,updating:!!secret.updating}));
  const updating=!!secret.accessToken;if(!updating&&(lease.state.selection.itemsCreated??0)>=10)throw new BankError('TRIAL_ITEM_LIMIT');
  const response=await bankRequest('/link/token/create',{client_name:'JARVIS',language:'en',country_codes:['US'],user:{client_user_id:lease.state.owner},redirect_uri:config.redirectUri,...(updating?{access_token:secret.accessToken}:{products:['transactions'],transactions:{days_requested:choice.historyDays},account_filters:{depository:{account_subtypes:['checking','savings']},credit:{account_subtypes:['credit card']}}})});
  const token=z.string().min(1).max(1000).parse(response.link_token),expiry=Date.parse(z.iso.datetime().parse(response.expiration));if(expiry<=Date.now())throw new BankError('LINK_EXPIRED');const sessionId=randomUUID();
  await lease.persist({...secret,linkToken:token,linkExpiry:expiry,sessionId,updating},{...lease.state.selection,environment:config.env,connected:!!secret.verified&&!!secret.accessToken,historyDays:updating?lease.state.selection.historyDays:choice.historyDays,syncMinutes:choice.syncMinutes,errorCode:undefined},'authorized');return {token,sessionId,updating};
 }catch(error){await lease.fail(error);throw error}
}
export async function resumeBankLink(run:BankRun,sessionId:string){
 z.uuid().parse(sessionId);bankConfig();return run(async(tx,owner)=>{
 const rows=await tx.$queryRawUnsafe<Row[]>('SELECT * FROM "ApiConnection" WHERE "userId"=$1::uuid AND provider=\'plaid\' AND mode=\'live\'',owner);const row=rows[0];if(!row?.tokenCiphertext)throw new BankError('LINK_EXPIRED');const secret=secretSchema.parse(JSON.parse(decryptToken(row.tokenCiphertext,owner+':'+row.id+':plaid')));requireEnvironment(secret);if(secret.sessionId!==sessionId||!secret.linkToken||(secret.linkExpiry??0)<=Date.now())throw new BankError('LINK_EXPIRED');return {token:secret.linkToken,sessionId,updating:!!secret.updating};
 });
}
export async function completeBankLink(run:BankRun,input:unknown){
 const parsed=z.object({sessionId:z.uuid(),publicToken:z.string().min(1).max(1000).nullable()}).strict().parse(input);bankConfig();const lease=await acquire(run,'complete');
 try{
  let secret=lease.secret();requireEnvironment(secret);
  if(lease.state.selection.completedSession===parsed.sessionId&&secret.verified){await lease.persist(secret,lease.state.selection,lease.state.status);return {connected:true}}
  if(secret.sessionId!==parsed.sessionId||(secret.linkExpiry??0)<=Date.now())throw new BankError('LINK_EXPIRED');
  if(!secret.accessToken){if(!parsed.publicToken)throw new BankError('LINK_INCOMPLETE');const exchanged=await bankRequest('/item/public_token/exchange',{public_token:parsed.publicToken});secret={...secret,accessToken:z.string().min(1).max(1000).parse(exchanged.access_token),verified:false};await lease.persist(secret,{...lease.state.selection,itemsCreated:(lease.state.selection.itemsCreated??0)+1},'authorized',false);lease.state.selection.itemsCreated=(lease.state.selection.itemsCreated??0)+1;}
  const response=await bankRequest('/item/get',{access_token:secret.accessToken});const item=z.object({institution_id:z.literal('ins_56'),error:z.unknown().nullable().optional()}).parse(response.item);if(item.error)throw new BankError('ITEM_LOGIN_REQUIRED');
  const allowedAccounts=z.array(z.unknown()).min(1).max(25).parse((await bankRequest('/accounts/get',{access_token:secret.accessToken})).accounts).map(normalizeAccount).map(a=>a.payload.accountId);
  await lease.fenced(async(tx,owner)=>{await tx.$executeRawUnsafe('UPDATE "ExternalRecord" SET deleted=true WHERE "connectionId"=$1::uuid AND "userId"=$2::uuid AND ($3::boolean OR payload->>\'accountId\' NOT IN(SELECT jsonb_array_elements_text($4::jsonb)))',lease.state.id,owner,!secret.updating,JSON.stringify(allowedAccounts));await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET "lastSyncAt"=NULL WHERE id=$1::uuid AND "userId"=$2::uuid',lease.state.id,owner)});
  const {linkToken:_,linkExpiry:__,sessionId:___,updating:____,...saved}=secret;void _;void __;void ___;void ____;
  await lease.persist({...saved,verified:true},{...lease.state.selection,connected:true,automaticSync:true,completedSession:parsed.sessionId,errorCode:undefined},'authorized');return {connected:true};
 }catch(error){await lease.fail(error);throw error}
}
export async function syncBank(run:BankRun){
 bankConfig();const lease=await acquire(run,'sync');
 try{
  const secret=lease.secret();requireEnvironment(secret);if(!secret.verified||!secret.accessToken)throw new BankError('NOT_CONNECTED');
  const accountResponse=await bankRequest('/accounts/get',{access_token:secret.accessToken});z.object({institution_id:z.literal('ins_56')}).parse(accountResponse.item);
  const accounts=z.array(z.unknown()).min(1).max(25).parse(accountResponse.accounts).map(normalizeAccount),allowed=new Set(accounts.map(a=>a.payload.accountId));
  const records=new Map<string,BankRecord>(),removed=new Set<string>();let cursor=lease.state.cursor,complete=false,historyStatus='NOT_READY';const seen=new Set<string>();
  // Nothing is committed until every page validates. Mutation errors leave the
  // original cursor in place, so retry restarts the whole delta as Plaid requires.
  for(let page=0;page<20;page++){
   const raw=await bankRequest('/transactions/sync',{access_token:secret.accessToken,...(cursor?{cursor}:{}),count:500});
   const batch=z.object({added:z.array(z.unknown()).max(500),modified:z.array(z.unknown()).max(500),removed:z.array(z.object({transaction_id:z.string().min(1).max(150)})).max(500),next_cursor:z.string().max(500),has_more:z.boolean(),transactions_update_status:z.enum(['NOT_READY','INITIAL_UPDATE_COMPLETE','HISTORICAL_UPDATE_COMPLETE']).optional()}).parse(raw);
   for(const input of [...batch.added,...batch.modified]){const record=normalizeTransaction(input);if(!allowed.has(record.payload.accountId))continue;records.set(record.externalId,record);removed.delete(record.externalId);if(record.payload.pendingId)removed.add('txn:'+record.payload.pendingId)}
   for(const item of batch.removed){const id='txn:'+item.transaction_id;records.delete(id);removed.add(id)}
   if(records.size+removed.size>10000)throw new BankError('HISTORY_LIMIT');cursor=batch.next_cursor;historyStatus=batch.transactions_update_status??historyStatus;
   await lease.fenced(async()=>undefined);if(!batch.has_more){complete=true;break}if(!cursor||seen.has(cursor))throw new BankError('REPEATED_CURSOR');seen.add(cursor);
  }
  if(!complete)throw new BankError('PAGE_LIMIT');
  await lease.fenced(async(tx,owner)=>{
   const timestamp=new Date().toISOString(),payload=[...accounts,...records.values()].map(record=>({...record,id:randomUUID()}));
   await tx.$executeRawUnsafe(`INSERT INTO "ExternalRecord"(id,"userId","connectionId","externalId",kind,payload,"sourceUrl","sourceUpdatedAt") SELECT id,$1::uuid,$2::uuid,"externalId",kind,payload,'https://www.chase.com/',now() FROM jsonb_to_recordset($3::jsonb) AS r(id uuid,"externalId" text,kind text,payload jsonb) ON CONFLICT("userId","connectionId","externalId") DO UPDATE SET payload=EXCLUDED.payload,"sourceUpdatedAt"=now(),"fetchedAt"=now(),deleted=false`,owner,lease.state.id,JSON.stringify(payload));
   await tx.$executeRawUnsafe(`UPDATE "ExternalRecord" SET deleted=true WHERE "userId"=$1::uuid AND "connectionId"=$2::uuid AND ("externalId" IN(SELECT jsonb_array_elements_text($3::jsonb)) OR payload->>'accountId' NOT IN(SELECT jsonb_array_elements_text($4::jsonb)))`,owner,lease.state.id,JSON.stringify([...removed]),JSON.stringify([...allowed]));
   await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET cursor=$3,"lastSyncAt"=now(),"retryAt"=now()+interval \'60 seconds\',status=\'healthy\',selection=$4::jsonb,"leaseToken"=NULL,"leaseUntil"=NULL,"updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',lease.state.id,owner,cursor,JSON.stringify({...lease.state.selection,historyStatus,errorCode:undefined,asOf:timestamp}));
   await tx.$executeRawUnsafe('INSERT INTO "SyncLog"(id,"userId","connectionId",status,"recordCount")VALUES($1::uuid,$2::uuid,$3::uuid,\'healthy\',$4)',randomUUID(),owner,lease.state.id,records.size);
  });return {count:records.size};
 }catch(error){await lease.fail(error);throw error}
}
export async function disconnectBank(run:BankRun,confirmed:boolean){
 if(confirmed!==true)throw new BankError('CONFIRM_DISCONNECT');bankConfig();const lease=await acquire(run,'disconnect');
 try{const secret=lease.secret();requireEnvironment(secret);await lease.fenced(async(tx,owner)=>tx.$executeRawUnsafe('UPDATE "ApiConnection" SET selection=jsonb_set(selection,$3::text[],$4::jsonb) WHERE id=$1::uuid AND "userId"=$2::uuid',lease.state.id,owner,['automaticSync'],'false'));lease.state.selection.automaticSync=false;if(secret.accessToken)try{await bankRequest('/item/remove',{access_token:secret.accessToken})}catch(error){if(!(error instanceof BankError)||!['INVALID_ACCESS_TOKEN','ITEM_NOT_FOUND'].includes(error.code))throw error}
  await lease.fenced(async(tx,owner)=>{await tx.$executeRawUnsafe('UPDATE "ApiConnection" SET "tokenCiphertext"=NULL,cursor=NULL,status=\'disconnected\',"leaseToken"=NULL,"leaseUntil"=NULL,"retryAt"=NULL,selection=$3::jsonb,"updatedAt"=now() WHERE id=$1::uuid AND "userId"=$2::uuid',lease.state.id,owner,JSON.stringify({...lease.state.selection,connected:false,completedSession:undefined}));await tx.auditLog.create({data:{userId:owner,action:'integration.bank.disconnect',outcome:'success'}})});return {disconnected:true};
 }catch(error){await lease.fail(error);throw error}
}
