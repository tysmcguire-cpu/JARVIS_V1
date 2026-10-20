import 'server-only';
import {randomUUID} from 'node:crypto';
import type {Prisma} from '@prisma/client';
import {currencies} from '@/features/tracking/config';
import {quickMoney} from './quick-money';
import {CommandError} from './commands';
import {resolveCategory} from '@/features/tracking/categories';
export async function quickMoneyInput(tx:Prisma.TransactionClient,owner:string,text:string){
 const parsed=quickMoney(text);
 const [settings]=await tx.$queryRawUnsafe<{currency:string;date:string}[]>('SELECT currency,to_char(now() AT TIME ZONE timezone,\'YYYY-MM-DD\') AS date FROM "UserSettings" WHERE "userId"=$1::uuid',owner);
 if(!settings||!currencies.includes(settings.currency))throw new CommandError('Set your currency in JARVIS Settings first.');
 const accounts=await tx.$queryRawUnsafe<{id:string;title:string;currency:string}[]>(`SELECT id,title,currency FROM "FinancialAccount" WHERE "userId"=$1::uuid ${parsed.account?'AND lower(title)=lower($2)':''} ORDER BY id LIMIT 2`,owner,...(parsed.account?[parsed.account]:[]));
 if(accounts.length>1)throw new CommandError('Which account? Send the entry with its exact name, for example: -20 food | Checking. Nothing was saved.');
 let account=accounts[0];if(!account){if(parsed.account)throw new CommandError('Account not found. Use an exact account name from Finances. Nothing was saved.');account={id:randomUUID(),title:'Personal',currency:settings.currency};await tx.$executeRawUnsafe('INSERT INTO "FinancialAccount"(id,"userId",title,currency,"openingBalance","updatedAt")VALUES($1::uuid,$2::uuid,$3,$4,0,date_trunc(\'milliseconds\',clock_timestamp()))',account.id,owner,account.title,account.currency)}
 let existing:string|undefined;try{existing=await resolveCategory(tx,owner,parsed.category,parsed.kind)}catch{throw new CommandError('Duplicate category names found. Rename or merge them in Finances before logging this entry. Nothing was saved.')}
 const categoryId=existing??randomUUID();if(!existing)await tx.$executeRawUnsafe('INSERT INTO "Category"(id,"userId",title,kind,"updatedAt")VALUES($1::uuid,$2::uuid,$3,$4,date_trunc(\'milliseconds\',clock_timestamp()))',categoryId,owner,parsed.category,parsed.kind);
 return {input:{title:parsed.description,amount:parsed.amount,accountId:account.id,categoryId,date:settings.date},account,kind:parsed.kind,category:parsed.category};
}
export async function quickAccountBalance(tx:Prisma.TransactionClient,owner:string,accountId:string){const [row]=await tx.$queryRawUnsafe<{balance:string}[]>(`SELECT (a."openingBalance"+COALESCE((SELECT sum(CASE WHEN c.kind='income' THEN t.amount ELSE -t.amount END) FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" WHERE t."accountId"=a.id AND t."userId"=$1::uuid),0))::text AS balance FROM "FinancialAccount" a WHERE a.id=$2::uuid AND a."userId"=$1::uuid`,owner,accountId);return BigInt(row.balance)}
