'use server';
import {withCustomerDatabase} from '@/lib/customer-db';
import {parseMoney} from './config';
import {lockCategories,resolveCategory} from './categories';
import {randomUUID} from 'node:crypto';
import type {Prisma} from '@prisma/client';
import {z} from 'zod';
type Tx=Prisma.TransactionClient;
async function category(tx:Tx,owner:string,kind:string,title:string){const existing=await resolveCategory(tx,owner,title,kind);if(existing)return existing;const id=randomUUID();await tx.$executeRawUnsafe('INSERT INTO "Category" (id,"userId",title,kind,"updatedAt") VALUES($1::uuid,$2::uuid,$3,$4,now())',id,owner,title,kind);return id}
async function insert(tx:Tx,owner:string,accountId:string,categoryId:string,amount:bigint,date:string,title:string,group:string|null=null){await tx.$executeRawUnsafe('INSERT INTO "Transaction" (id,"userId","accountId","categoryId",amount,date,title,"updatedAt","transferGroup") VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6::date,$7,now(),$8::uuid)',randomUUID(),owner,accountId,categoryId,amount,date,title,group)}
export async function financeAccounts(){return withCustomerDatabase((tx,owner)=>tx.$queryRawUnsafe<{id:string;title:string;currency:string;balance:string}[]>('SELECT a.id,a.title,a.currency,(a."openingBalance"+COALESCE((SELECT sum(CASE WHEN c.kind=\'income\' THEN t.amount ELSE -t.amount END) FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" WHERE t."userId"=$1::uuid AND t."accountId"=a.id),0))::text AS balance FROM "FinancialAccount" a WHERE a."userId"=$1::uuid ORDER BY a.title,a.id LIMIT 500',owner))}
export async function transferMoney(input:unknown){const value=z.object({from:z.uuid(),to:z.uuid(),amount:z.string(),date:z.iso.date(),title:z.string().trim().min(1).max(200),requestId:z.uuid()}).parse(input);const amount=parseMoney(value.amount);if(amount<=0n||value.from===value.to)throw Error('Choose different accounts and a positive amount.');
 return withCustomerDatabase(async(tx,owner)=>{
  await lockCategories(tx,owner);
  // Ordered account locks serialize balance-changing operations and avoid transfer deadlocks.
  const accounts=await tx.$queryRawUnsafe<{id:string;currency:string}[]>('SELECT id,currency FROM "FinancialAccount" WHERE "userId"=$1::uuid AND id IN($2::uuid,$3::uuid) ORDER BY id FOR UPDATE',owner,value.from,value.to);
  if(accounts.length!==2||accounts[0].currency!==accounts[1].currency)throw Error('Choose two accounts with the same currency.');
  const previous=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "Transaction" WHERE "userId"=$1::uuid AND "transferGroup"=$2::uuid',owner,value.requestId);if(previous.length)return {ok:true};
  const out=await category(tx,owner,'expense','Account transfers out'),incoming=await category(tx,owner,'income','Account transfers in');
  await insert(tx,owner,value.from,out,amount,value.date,value.title,value.requestId);await insert(tx,owner,value.to,incoming,amount,value.date,value.title,value.requestId);
  await tx.auditLog.create({data:{userId:owner,action:'tracking.transfer.create',outcome:'success'}});return {ok:true};
 });
}
export async function reconcileAccount(input:unknown){const value=z.object({account:z.uuid(),balance:z.string(),expected:z.string(),date:z.iso.date(),title:z.string().trim().min(1).max(200)}).parse(input),target=parseMoney(value.balance);if(!/^-?\d+$/.test(value.expected))throw Error('Reload the account balance.');
 return withCustomerDatabase(async(tx,owner)=>{
  await lockCategories(tx,owner);
  const accounts=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "FinancialAccount" WHERE "userId"=$1::uuid AND id=$2::uuid FOR UPDATE',owner,value.account);if(!accounts.length)throw Error('Account unavailable.');
  const [{balance}]=await tx.$queryRawUnsafe<{balance:string}[]>('SELECT (a."openingBalance"+COALESCE((SELECT sum(CASE WHEN c.kind=\'income\' THEN t.amount ELSE -t.amount END) FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" WHERE t."userId"=$1::uuid AND t."accountId"=a.id),0))::text AS balance FROM "FinancialAccount" a WHERE a."userId"=$1::uuid AND a.id=$2::uuid',owner,value.account);
  if(balance!==value.expected)throw Error('The balance changed. Reload before reconciling.');const difference=target-BigInt(balance);if(!difference)return {ok:true};
  const id=await category(tx,owner,difference>0n?'income':'expense','Reconciliation adjustments');await insert(tx,owner,value.account,id,difference<0n?-difference:difference,value.date,value.title);
  await tx.auditLog.create({data:{userId:owner,action:'tracking.reconciliation.create',outcome:'success'}});return {ok:true};
 });
}
export async function recordRecurringPayment(id:string,version:string){z.uuid().parse(id);z.iso.datetime({offset:true}).parse(version);return withCustomerDatabase(async(tx,owner)=>{
 const [record]=await tx.$queryRawUnsafe<{title:string;accountId:string;categoryId:string;amount:bigint;dueDate:string;frequency:string}[]>('SELECT title,"accountId","categoryId",amount,"dueDate"::text,"frequency" FROM "RecurringExpense" WHERE id=$1::uuid AND "userId"=$2::uuid AND "updatedAt"=$3::timestamptz FOR UPDATE',id,owner,version);if(!record)throw Error('This recurring expense changed. Reload first.');
 await tx.$queryRawUnsafe('SELECT id FROM "FinancialAccount" WHERE id=$1::uuid AND "userId"=$2::uuid FOR UPDATE',record.accountId,owner);
 const [settings]=await tx.$queryRawUnsafe<{today:string}[]>('SELECT (now() AT TIME ZONE timezone)::date::text AS today FROM "UserSettings" WHERE "userId"=$1::uuid',owner);if(record.dueDate>settings.today)throw Error('This payment is not due yet.');
 await insert(tx,owner,record.accountId,record.categoryId,record.amount,record.dueDate,record.title);
 const interval=record.frequency==='weekly'?'1 week':record.frequency==='monthly'?'1 month':'1 year';
 await tx.$executeRawUnsafe('UPDATE "RecurringExpense" SET "dueDate"=("dueDate"+$3::interval)::date,"updatedAt"=GREATEST(date_trunc(\'milliseconds\',clock_timestamp()),"updatedAt"+interval \'1 millisecond\') WHERE id=$1::uuid AND "userId"=$2::uuid',id,owner,interval);
 await tx.auditLog.create({data:{userId:owner,action:'tracking.recurring.record',outcome:'success'}});return {ok:true};
})}
