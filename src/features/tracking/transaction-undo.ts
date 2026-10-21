import 'server-only';
import {randomUUID} from 'node:crypto';
import type {Prisma} from '@prisma/client';
import {withOwnerDatabase} from '@/lib/owner-db';
import {z} from 'zod';
export async function keepDeletedTransactions(tx:Prisma.TransactionClient,owner:string,ids:string[]){
 const rows=await tx.$queryRawUnsafe<{id:string;title:string;accountId:string;categoryId:string;amount:string;date:string;transferGroup:string|null}[]>('SELECT id,title,"accountId","categoryId",amount::text,date::text,"transferGroup" FROM "Transaction" WHERE "userId"=$1::uuid AND id=ANY($2::uuid[]) ORDER BY id',owner,ids);
 if(!rows.length)return undefined;const undoId=randomUUID();
 await tx.$executeRawUnsafe('DELETE FROM "WorkspaceState" WHERE "userId"=$1::uuid AND key LIKE \'deleted-transaction:%\' AND "updatedAt"<now()-interval \'1 day\'',owner);
 await tx.$executeRawUnsafe('INSERT INTO "WorkspaceState" (id,"userId",key,value,version,"updatedAt") VALUES($1::uuid,$2::uuid,$3,$4::jsonb,1,now())',randomUUID(),owner,'deleted-transaction:'+undoId,JSON.stringify(rows));return undoId;
}
export async function undoTransactionDeletion(input:string){const id=z.uuid().parse(input);return withOwnerDatabase(async(tx,owner)=>{
 const [saved]=await tx.$queryRawUnsafe<{value:unknown}[]>('SELECT value FROM "WorkspaceState" WHERE "userId"=$1::uuid AND key=$2 AND "updatedAt">now()-interval \'10 minutes\' FOR UPDATE',owner,'deleted-transaction:'+id);if(!saved)throw Error('Undo expired or was already used.');
 const rows=z.array(z.object({id:z.uuid(),title:z.string().min(1).max(200),accountId:z.uuid(),categoryId:z.uuid(),amount:z.string().regex(/^\d+$/),date:z.iso.date(),transferGroup:z.uuid().nullable()})).min(1).max(2).parse(saved.value);
 // Deterministic account locks include both sides of a transfer.
 await tx.$queryRawUnsafe('SELECT id FROM "FinancialAccount" WHERE "userId"=$1::uuid AND id=ANY($2::uuid[]) ORDER BY id FOR UPDATE',owner,rows.map(r=>r.accountId));
 for(const row of rows)await tx.$executeRawUnsafe('INSERT INTO "Transaction" (id,"userId",title,"accountId","categoryId",amount,date,"transferGroup","updatedAt") VALUES($1::uuid,$2::uuid,$3,$4::uuid,$5::uuid,$6::bigint,$7::date,$8::uuid,date_trunc(\'milliseconds\',clock_timestamp()))',row.id,owner,row.title,row.accountId,row.categoryId,row.amount,row.date,row.transferGroup);
 await tx.$executeRawUnsafe('DELETE FROM "WorkspaceState" WHERE "userId"=$1::uuid AND key=$2',owner,'deleted-transaction:'+id);await tx.auditLog.create({data:{userId:owner,action:'tracking.Transaction.undoDelete',outcome:'success'}});return {ok:true};
})}
