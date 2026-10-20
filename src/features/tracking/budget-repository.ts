import 'server-only';
import {randomUUID} from 'node:crypto';
import {withOwnerDatabase} from '@/lib/owner-db';
import {budgetInput} from './budgets';
import {resolveCategory} from './categories';
import {recordId} from './validation';
export async function writeBudget(input:unknown,id?:string,version?:string){
 const value=budgetInput(input);if(id)recordId.parse(id);
 return withOwnerDatabase(async(tx,owner)=>{
  // Lock ordering matches ordinary category writes and Telegram.
  let category=await resolveCategory(tx,owner,value.category,'expense');
  if(!category){category=randomUUID();await tx.$executeRawUnsafe('INSERT INTO "Category"(id,"userId",title,kind,"updatedAt")VALUES($1::uuid,$2::uuid,$3,\'expense\',now())',category,owner,value.category);await tx.auditLog.create({data:{userId:owner,action:'tracking.Category.create',outcome:'success'}})}
  if(id){
   const count=await tx.$executeRawUnsafe('UPDATE "BudgetCategory" SET title=$1,"categoryId"=$2::uuid,"limitAmount"=$3,"updatedAt"=GREATEST(date_trunc(\'milliseconds\',clock_timestamp()),"updatedAt"+interval \'1 millisecond\') WHERE id=$4::uuid AND "userId"=$5::uuid AND "updatedAt"=$6::timestamptz',value.title,category,value.limit,id,owner,version??'1970-01-01');
   if(count!==1)throw Error('This budget changed or is unavailable. Reload before editing.');
   await tx.$executeRawUnsafe('UPDATE "Budget" b SET title=$1,"updatedAt"=now() WHERE b."userId"=$2::uuid AND b.id=(SELECT "budgetId" FROM "BudgetCategory" WHERE id=$3::uuid AND "userId"=$2::uuid) AND (SELECT count(*) FROM "BudgetCategory" l WHERE l."budgetId"=b.id AND l."userId"=$2::uuid)=1',value.title,owner,id);
  }else{
   const parent=randomUUID();await tx.$executeRawUnsafe('INSERT INTO "Budget"(id,"userId",title,currency,"startDate","endDate","updatedAt")VALUES($1::uuid,$2::uuid,$3,$4,$5::date,$6::date,now())',parent,owner,value.title,value.currency,value.startDate,value.endDate);
   await tx.$executeRawUnsafe('INSERT INTO "BudgetCategory"(id,"userId",title,"budgetId","categoryId","limitAmount","updatedAt")VALUES($1::uuid,$2::uuid,$3,$4::uuid,$5::uuid,$6,now())',randomUUID(),owner,value.title,parent,category,value.limit);
  }
  await tx.auditLog.create({data:{userId:owner,action:`tracking.BudgetCategory.${id?'update':'create'}`,outcome:'success'}});
 });
}
export async function removeBudget(id:string,version:string){
 recordId.parse(id);
 return withOwnerDatabase(async(tx,owner)=>{
  const rows=await tx.$queryRawUnsafe<{budgetId:string}[]>('DELETE FROM "BudgetCategory" WHERE id=$1::uuid AND "userId"=$2::uuid AND "updatedAt"=$3::timestamptz RETURNING "budgetId"',id,owner,version);
  if(rows.length!==1)throw Error('This budget changed or is unavailable. Reload before deleting.');
  await tx.$executeRawUnsafe('DELETE FROM "Budget" b WHERE b.id=$1::uuid AND b."userId"=$2::uuid AND NOT EXISTS(SELECT 1 FROM "BudgetCategory" l WHERE l."budgetId"=b.id AND l."userId"=$2::uuid)',rows[0].budgetId,owner);
  await tx.auditLog.create({data:{userId:owner,action:'tracking.BudgetCategory.delete',outcome:'success'}});
 });
}
