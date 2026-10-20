import {moduleSummary,type ModuleFacts} from './module-metrics';
import 'server-only';
import { randomUUID } from 'node:crypto';
import { withOwnerDatabase } from '@/lib/owner-db';
import { entities, entityFor, formatMoney, type WorkspaceData } from './config';
import { recordId, validateRecord } from './validation';
import {workspaceQuery} from './read-query';
const quoted = (name: string) => `"${name}"`; // Names come exclusively from the static entity definitions.
type ReadResult=Omit<WorkspaceData,"summary"|"chart"> & {facts:ModuleFacts;statuses:{label:string;value:number}[];balances?:{currency:string;balance:string}[];spending?:{label:string;value:string}[];grade?:{earned:string;possible:string};budgetSpending?:{title:string;currency:string;spent:string}[]};
export async function readWorkspace(key:string,input:unknown):Promise<WorkspaceData>{
 const {sql,params,entity}=workspaceQuery(key,input);
 return withOwnerDatabase(async(tx,owner)=>{
  params[0]=owner;const [{data}]=await tx.$queryRawUnsafe<{data:ReadResult}[]>(sql,...params);
  const summary:WorkspaceData["summary"]=moduleSummary(key,data.total,data.facts);let chart:WorkspaceData["chart"]=data.statuses;

  if(data.balances)summary.push(...data.balances.map(r=>({label:"Account balance",value:formatMoney(BigInt(r.balance),r.currency)})));
  if(data.spending)chart=data.spending.map(r=>({label:r.label+" · "+formatMoney(BigInt(r.value),r.label.slice(0,3)),value:Number(r.value)/100}));
  if(entity.key!=="Grade"&&data.grade&&BigInt(data.grade.possible)>0n)summary.push({label:"Recorded points (unweighted)",value:(Number(data.grade.earned)/Number(data.grade.possible)*100).toFixed(1)+"%"});
  if(key==="Goal")chart=data.rows.map(r=>({label:r.title,value:Math.min(100,Number(r.current)/Number(r.target)*100)}));
  if(data.budgetSpending)summary.push(...data.budgetSpending.map(r=>({label:"Spent · "+r.title,value:formatMoney(BigInt(r.spent),r.currency)})));
  return {rows:data.rows,total:data.total,page:data.page,pageSize:4,options:data.options,relationsTruncated:data.relationsTruncated,calendar:data.calendar,summary:summary.slice(0,5),today:data.facts.today,finance:data.finance,general:data.general,chart};
 });
}
export async function writeRecord(key: string, input: unknown, id?: string, expectedUpdatedAt?: string) {
  const entity=entityFor(key); const values=validateRecord(key,input); if(id)recordId.parse(id);
  return withOwnerDatabase(async(tx,ownerId)=>{
    for(const field of entity.fields.filter(f=>f.target)) {
      const found=await tx.$queryRawUnsafe<{id:string}[]>(`SELECT id FROM ${quoted(field.target!)} WHERE id=$1::uuid AND "userId"=$2::uuid`,values[field.name],ownerId);
      if(!found.length)throw Error('A linked record is unavailable.');
    }
    if(key==='BudgetCategory') {
      const category=await tx.$queryRawUnsafe<{kind:string}[]>('SELECT kind FROM "Category" WHERE id=$1::uuid AND "userId"=$2::uuid FOR UPDATE',values.categoryId,ownerId);
      if(category[0]?.kind!=='expense')throw Error('Budget limits require an expense category.');
    }
    if(key==='RecurringExpense') {
      const category=await tx.$queryRawUnsafe<{kind:string}[]>('SELECT kind FROM "Category" WHERE id=$1::uuid AND "userId"=$2::uuid',values.categoryId,ownerId);
      if(category[0]?.kind!=='expense')throw Error('Recurring expenses require an expense category.');
    }
    if (id && key === 'FinancialAccount') {
      const changed=await tx.$queryRawUnsafe<{currency:string}[]>('SELECT currency FROM "FinancialAccount" WHERE id=$1::uuid AND "userId"=$2::uuid FOR UPDATE',id,ownerId);
      const used=await tx.$queryRawUnsafe<{present:boolean}[]>('SELECT EXISTS(SELECT 1 FROM "Transaction" WHERE "accountId"=$1::uuid AND "userId"=$2::uuid UNION ALL SELECT 1 FROM "RecurringExpense" WHERE "accountId"=$1::uuid AND "userId"=$2::uuid) AS present',id,ownerId);
      if(changed[0] && changed[0].currency!==values.currency && used[0].present)throw Error('Remove linked transactions and recurring expenses before changing the account currency.');
    }
    if(id && key === 'Category') {
      const changed=await tx.$queryRawUnsafe<{kind:string}[]>('SELECT kind FROM "Category" WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId);
      const used=await tx.$queryRawUnsafe<{present:boolean}[]>('SELECT EXISTS(SELECT 1 FROM "Transaction" WHERE "categoryId"=$1::uuid AND "userId"=$2::uuid UNION ALL SELECT 1 FROM "BudgetCategory" WHERE "categoryId"=$1::uuid AND "userId"=$2::uuid UNION ALL SELECT 1 FROM "RecurringExpense" WHERE "categoryId"=$1::uuid AND "userId"=$2::uuid) AS present',id,ownerId);
      if(changed[0] && changed[0].kind!==values.kind && used[0].present)throw Error('Remove linked records before changing the category type.');
    }
    const cast=(name:string)=>entity.fields.find(f=>f.name===name)?.type==='relation'?'::uuid':entity.fields.find(f=>f.name===name)?.type==='date'?'::date':'';
    const keys=Object.keys(values); const params=Object.values(values);
    const result=id ? await tx.$executeRawUnsafe(`UPDATE ${quoted(key)} SET ${keys.map((k,i)=>`${quoted(k)}=$${i+1}${cast(k)}`).join(',')},"updatedAt"=GREATEST(date_trunc('milliseconds',clock_timestamp()),"updatedAt" + interval '1 millisecond') WHERE id=$${params.length+1}::uuid AND "userId"=$${params.length+2}::uuid AND "updatedAt"=$${params.length+3}::timestamptz`,...params,id,ownerId,expectedUpdatedAt??'1970-01-01') : await tx.$executeRawUnsafe(`INSERT INTO ${quoted(key)} (${keys.map(quoted).join(',')},id,"userId","updatedAt") VALUES (${keys.map((k,i)=>`$${i+1}${cast(k)}`).join(',')},$${params.length+1}::uuid,$${params.length+2}::uuid,date_trunc('milliseconds',clock_timestamp()))`,...params,randomUUID(),ownerId);
    if(result!==1)throw Error('This record changed or is unavailable. Reload before editing.');
    await tx.auditLog.create({data:{userId:ownerId,action:`tracking.${key}.${id?'update':'create'}`,outcome:'success'}});
  });
}
export async function removeRecord(key:string,id:string,updatedAt:string) {
  entityFor(key);recordId.parse(id);
  return withOwnerDatabase(async(tx,ownerId)=>{
    const result=await tx.$executeRawUnsafe(`DELETE FROM ${quoted(key)} WHERE id=$1::uuid AND "userId"=$2::uuid AND "updatedAt"=$3::timestamptz`,id,ownerId,updatedAt);
    if(result!==1)throw Error('This record changed or is unavailable. Reload before deleting.');
    await tx.auditLog.create({data:{userId:ownerId,action:`tracking.${key}.delete`,outcome:'success'}});
  });
}
export function moduleForEntity(key:string) {return entities.find(e=>e.key===key)?.module;}
export async function readLinkedChoices(key:string,fieldName:string,search:string) {
 const entity=entityFor(key);const field=entity.fields.find(f=>f.name===fieldName&&f.target);if(!field||search.length>100)throw Error('Invalid linked-record search.');
 return withOwnerDatabase((tx,ownerId)=>tx.$queryRawUnsafe<{id:string;title:string}[]>(`SELECT id,title FROM "${field.target}" WHERE "userId"=$1::uuid AND title ILIKE $2 ORDER BY title,id LIMIT 50`,ownerId,`%${search.replace(/[\\%_]/g,'\\$&')}%`));
}
