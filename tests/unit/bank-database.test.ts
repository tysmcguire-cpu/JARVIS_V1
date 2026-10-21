import {beforeAll,beforeEach,afterAll,it,expect,vi} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
let database:PGlite;const owner='a2c92111-c2a3-4ab2-91dc-3d1abc84cc33',other='b2c92111-c2a3-4ab2-91dc-3d1abc84cc33';let activeOwner=owner;
vi.mock('server-only',()=>({}));vi.mock('@/lib/db',()=>({db:{}}));
vi.mock('@/lib/customer-db',()=>({withCustomerDatabase:async(work:(tx:unknown,owner:string)=>Promise<unknown>)=>database.transaction(async tx=>{await tx.exec(`SET LOCAL ROLE runtime;SET LOCAL request.jwt.claim.sub='${activeOwner}'`);return work({$queryRawUnsafe:async(sql:string,...args:unknown[])=>(await tx.query(sql,args)).rows,$executeRawUnsafe:async(sql:string,...args:unknown[])=>(await tx.query(sql,args)).affectedRows,auditLog:{create:async({data}:{data:{userId:string;action:string;outcome:string}})=>tx.query('INSERT INTO "AuditLog"(id,"userId",action,outcome)VALUES(gen_random_uuid(),$1,$2,$3)',[data.userId,data.action,data.outcome])}},activeOwner)})}));
import {withCustomerDatabase} from '@/lib/customer-db';
import {startBankLink,completeBankLink,resumeBankLink,syncBank,disconnectBank} from '@/features/banking/service';
import {bankHistory,bankState} from '@/features/banking/repository';
import {refreshDueBank} from '@/features/banking/worker';
const account={account_id:'synthetic-checking',name:'Synthetic Chase checking',mask:'1234',type:'depository',subtype:'checking',balances:{current:1234.56,available:1200,iso_currency_code:'USD'}};
const transaction=(id:string,pending=false,amount=12.34)=>({transaction_id:id,account_id:account.account_id,name:'Synthetic purchase '+id,merchant_name:'Synthetic merchant',date:'2026-10-17',amount,iso_currency_code:'USD',pending,pending_transaction_id:null});
let batches:Record<string,unknown>[],apiCalls:{path:string;body:Record<string,unknown>}[],removeFails=false;
const batch=(added:unknown[]=[],extra:Record<string,unknown>={})=>({added,modified:[],removed:[],next_cursor:'cursor-'+Math.random(),has_more:false,transactions_update_status:'HISTORICAL_UPDATE_COMPLETE',...extra});
beforeAll(async()=>{database=new PGlite();await database.exec(`CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE runtime;GRANT USAGE ON SCHEMA public,auth TO runtime;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid()RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;INSERT INTO auth.users VALUES('${owner}');`);for(const name of ['20261015000000_foundation','20261016000000_core_tracking','20261016020000_integrations','20261017020000_bank_history'])await database.exec(readFileSync('prisma/migrations/'+name+'/migration.sql','utf8'));await database.exec(`INSERT INTO "User"(id,"updatedAt")VALUES('${owner}',now());GRANT SELECT,INSERT,UPDATE,DELETE ON "ApiConnection","ExternalRecord","SyncLog" TO runtime;GRANT SELECT,INSERT ON "AuditLog" TO runtime;`);},30000);
beforeEach(()=>{
 for(const [key,value] of Object.entries({PLAID_ENABLED:'true',PLAID_ENV:'sandbox',PLAID_CLIENT_ID:'synthetic-client',PLAID_SECRET:'synthetic-secret',PLAID_REDIRECT_URI:'http://localhost:3000/bank-link',PLUTO_CONNECTOR_ENCRYPTION_KEY:'a'.repeat(64)}))vi.stubEnv(key,value);apiCalls=[];batches=[];removeFails=false;
 vi.stubGlobal('fetch',vi.fn<typeof fetch>(async(url,init)=>{const path=new URL(String(url)).pathname,body=JSON.parse(String(init?.body));apiCalls.push({path,body});let response:unknown={};
  if(path==='/link/token/create')response={link_token:'synthetic-link-token',expiration:'2099-01-01T00:00:00Z'};
  if(path==='/item/public_token/exchange')response={access_token:'synthetic-access-token',item_id:'synthetic-item'};
  if(path==='/item/get')response={item:{institution_id:'ins_56',error:null}};
  if(path==='/accounts/get')response={item:{institution_id:'ins_56'},accounts:[account]};
  if(path==='/transactions/sync'){response=batches.shift();if(!response)throw Error('No synthetic page configured');if('error_code' in (response as object))return new Response(JSON.stringify(response),{status:400})}
  if(path==='/item/remove'&&removeFails)throw Error('synthetic disconnect failure');return new Response(JSON.stringify(response));
 }));
});
afterAll(async()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();await database?.close()});
async function clearRetry(){await database.exec('UPDATE "ApiConnection" SET "retryAt"=NULL')}
it('encrypts explicit owner grants, binds OAuth resume/completion and never exposes server credentials in status',async()=>{
 const link=await startBankLink(withCustomerDatabase,{approved:true,historyDays:730,syncMinutes:360});expect(apiCalls[0].body).toMatchObject({products:['transactions'],transactions:{days_requested:730},redirect_uri:'http://localhost:3000/bank-link'});expect((await resumeBankLink(withCustomerDatabase,link.sessionId)).token).toBe('synthetic-link-token');await expect(completeBankLink(withCustomerDatabase,{sessionId:other,publicToken:'foreign'})).rejects.toThrow();expect(apiCalls.filter(c=>c.path.includes('exchange'))).toHaveLength(0);
 expect(await completeBankLink(withCustomerDatabase,{sessionId:link.sessionId,publicToken:'synthetic-public-token'})).toEqual({connected:true});expect(await completeBankLink(withCustomerDatabase,{sessionId:link.sessionId,publicToken:'replay'})).toEqual({connected:true});expect(apiCalls.filter(c=>c.path.includes('exchange'))).toHaveLength(1);
 const row=(await database.query<{tokenCiphertext:string;selection:unknown}>('SELECT "tokenCiphertext",selection FROM "ApiConnection"')).rows[0];expect(row.tokenCiphertext).not.toContain('synthetic-access-token');expect(JSON.stringify(row.selection)).not.toContain('synthetic-link-token');const state=await bankState();expect(state.connected).toBe(true);expect(JSON.stringify(state)).not.toContain('token');await expect(resumeBankLink(withCustomerDatabase,link.sessionId)).rejects.toThrow();
});
it('accepts initial empty history, then updates pending/posting identities and removed transactions exactly',async()=>{
 batches=[batch([],{next_cursor:'',transactions_update_status:'NOT_READY'})];await syncBank(withCustomerDatabase);expect((await bankHistory({})).total).toBe(0);await clearRetry();
 batches=[batch([transaction('pending',true)],{next_cursor:'cursor-1'})];await syncBank(withCustomerDatabase);let history=await bankHistory({});expect(history.rows[0]).toMatchObject({amount:'-1234',status:'pending'});expect(history.accounts[0]).toMatchObject({current:'123456',available:'120000'});await clearRetry();
 batches=[batch([{...transaction('posted'),pending_transaction_id:'pending'},transaction('refund',false,-10)],{removed:[{transaction_id:'pending'}],next_cursor:'cursor-2'})];await syncBank(withCustomerDatabase);history=await bankHistory({});expect(history.total).toBe(2);expect(history.rows.some(r=>r.status==='pending')).toBe(false);expect(history.rows.find(r=>r.title==='Synthetic purchase refund')).toMatchObject({amount:'1000',direction:'inflow'});const id=history.rows.find(r=>r.title==='Synthetic purchase posted')!.id;await clearRetry();
 batches=[batch([],{modified:[transaction('posted',false,12.4)],removed:[{transaction_id:'refund'}],next_cursor:'cursor-3'})];await syncBank(withCustomerDatabase);history=await bankHistory({search:'posted',status:'posted',start:'2026-10-01',end:'2026-10-31'});expect(history.total).toBe(1);expect(history.rows[0]).toMatchObject({id,amount:'-1240'});expect(apiCalls.some(c=>c.path.includes('refresh'))).toBe(false);
});
it('keeps the original cursor and snapshot when a later delta page fails, then retries the full delta',async()=>{
 await clearRetry();batches=[batch([transaction('uncommitted')],{next_cursor:'intermediate',has_more:true}),{error_code:'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION',error_message:'private-secret'}];await expect(syncBank(withCustomerDatabase)).rejects.toThrow();expect((await bankHistory({})).rows.some(r=>r.title==='Synthetic purchase uncommitted')).toBe(false);expect((await database.query<{cursor:string}>('SELECT cursor FROM "ApiConnection"')).rows[0].cursor).toBe('cursor-3');
 await clearRetry();batches=[batch([transaction('committed')],{next_cursor:'cursor-4'})];await syncBank(withCustomerDatabase);expect(apiCalls.filter(c=>c.path==='/transactions/sync').at(-1)?.body.cursor).toBe('cursor-3');
});
it('rolls back all transaction changes if the final checkpoint transaction fails',async()=>{
 await clearRetry();await database.exec('REVOKE INSERT ON "SyncLog" FROM runtime');batches=[batch([transaction('rollback')],{next_cursor:'bad-checkpoint'})];try{await expect(syncBank(withCustomerDatabase)).rejects.toThrow();expect((await bankHistory({search:'rollback'})).total).toBe(0);expect((await database.query<{cursor:string}>('SELECT cursor FROM "ApiConnection"')).rows[0].cursor).toBe('cursor-4')}finally{await database.exec('GRANT INSERT ON "SyncLog" TO runtime')}
});
it('reconnects through update mode without creating another Item or enabling other products',async()=>{
 const link=await startBankLink(withCustomerDatabase,{approved:true,historyDays:30,syncMinutes:60});expect(link.updating).toBe(true);expect(apiCalls[0].body.access_token).toBe('synthetic-access-token');expect(apiCalls[0].body.products).toBeUndefined();await completeBankLink(withCustomerDatabase,{sessionId:link.sessionId,publicToken:null});expect(apiCalls.filter(c=>c.path.includes('exchange'))).toHaveLength(0);expect((await bankHistory({})).total).toBeGreaterThan(0);
});
it('isolates bank history by owner and respects schedule/retry/lease gates without fetching',async()=>{
 activeOwner=other;try{expect((await bankHistory({})).total).toBe(0);expect((await bankState()).connected).toBe(false)}finally{activeOwner=owner}
 await database.exec('UPDATE "ApiConnection" SET "lastSyncAt"=now()');expect(await refreshDueBank(withCustomerDatabase)).toBe(0);expect(apiCalls).toHaveLength(0);
});
it('pauses scheduled reads on failed revocation, then removes the credential on successful revocation',async()=>{
 removeFails=true;await expect(disconnectBank(withCustomerDatabase,true)).rejects.toThrow();expect(await refreshDueBank(withCustomerDatabase)).toBe(0);removeFails=false;await disconnectBank(withCustomerDatabase,true);expect((await bankHistory({})).total).toBe(0);expect((await database.query<{tokenCiphertext:string|null}>('SELECT "tokenCiphertext" FROM "ApiConnection"')).rows[0].tokenCiphertext).toBeNull();await expect(syncBank(withCustomerDatabase)).rejects.toThrow();
});
