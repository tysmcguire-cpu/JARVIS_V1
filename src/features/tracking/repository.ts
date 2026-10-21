import {moduleSummary,type ModuleFacts} from './module-metrics';
import 'server-only';
import {keepDeletedTransactions} from './transaction-undo';
import {eventSeriesDates} from './event-series';
import {z} from 'zod';
import { randomUUID } from 'node:crypto';
import { withCustomerDatabase } from '@/lib/customer-db';
import { entities, entityFor, formatMoney, type WorkspaceData } from './config';
import { recordId, validateRecord } from './validation';
import {workspaceQuery} from './read-query';
import {categoryName,resolveCategory} from './categories';
const quoted = (name: string) => `"${name}"`; // Names come exclusively from the static entity definitions.
type ReadResult=Omit<WorkspaceData,"summary"|"chart"> & {facts:ModuleFacts;statuses:{label:string;value:number}[];balances?:{currency:string;balance:string}[];spending?:{label:string;value:string}[];timezone?:string;grade?:{earned:string;possible:string};budgetSpending?:{title:string;currency:string;spent:string}[]};
export async function readWorkspace(key:string,input:unknown):Promise<WorkspaceData>{
 const {sql,params}=workspaceQuery(key,input);
 return withCustomerDatabase(async(tx,owner)=>{
  params[0]=owner;const [{data}]=await tx.$queryRawUnsafe<{data:ReadResult}[]>(sql,...params);
  const summary:WorkspaceData["summary"]=moduleSummary(key,data.total,data.facts);let chart:WorkspaceData["chart"]=data.statuses;

  if(data.balances)summary.push(...data.balances.map(r=>({label:"Account balance",value:formatMoney(BigInt(r.balance),r.currency)})));
  if(data.spending)chart=data.spending.map(r=>({label:r.label+" · "+formatMoney(BigInt(r.value),r.label.slice(0,3)),value:Number(r.value)/100}));

  if(key==="Goal")chart=data.rows.map(r=>({label:r.title,value:Math.min(100,Number(r.current)/Number(r.target)*100)}));
  if(data.budgetSpending)summary.push(...data.budgetSpending.map(r=>({label:"Spent · "+r.title,value:formatMoney(BigInt(r.spent),r.currency)})));
  return {rows:data.rows,total:data.total,page:data.page,pageSize:data.pageSize,options:data.options,relationsTruncated:data.relationsTruncated,calendar:data.calendar,summary:summary.slice(0,5),today:data.facts.today,timezone:data.timezone,finance:data.finance,general:data.general,accountHistory:data.accountHistory,chart};
 });
}
export async function writeRecord(key: string, input: unknown, id?: string, expectedUpdatedAt?: string) {
  const entity=entityFor(key); const values=validateRecord(key,input); if(id)recordId.parse(id);
  const extra=input as Record<string,string>;const series=key==='Event'&&!id?eventSeriesDates(String(values.startDate),String(values.endDate),extra.repeat??'none',Number(extra.repeatCount??1)):[];
  const seriesId=series.length>1?z.uuid().parse(extra.seriesId):null;
  return withCustomerDatabase(async(tx,ownerId)=>{
    if(seriesId){const existing=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "Event" WHERE "userId"=$1::uuid AND "seriesId"=$2::uuid LIMIT 1',ownerId,seriesId);if(existing.length)return;}
    if(key==='Transaction'&&id){const [current]=await tx.$queryRawUnsafe<{transferGroup:string|null}[]>('SELECT "transferGroup" FROM "Transaction" WHERE id=$1::uuid AND "userId"=$2::uuid',id,ownerId);if(current?.transferGroup)throw Error('Delete both transfer entries and create a replacement to correct a transfer.');}
    if(key==='Category'){
      values.title=categoryName(String(values.title));
      const existing=await resolveCategory(tx,ownerId,String(values.title),String(values.kind));
      if(existing&&existing!==id)throw Error('A category with this name and type already exists. Use the existing category.');
    }
    for(const field of entity.fields.filter(f=>f.target)) {
      const found=await tx.$queryRawUnsafe<{id:string}[]>(`SELECT id FROM ${quoted(field.target!)} WHERE id=$1::uuid AND "userId"=$2::uuid FOR UPDATE`,values[field.name],ownerId);
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
    const cast=(name:string)=>name==='seriesId'?'::uuid':entity.fields.find(f=>f.name===name)?.type==='relation'?'::uuid':entity.fields.find(f=>f.name===name)?.type==='date'?'::date':'';
    if(seriesId)values.seriesId=seriesId;
    const keys=Object.keys(values); const params=Object.values(values);
    const result=id ? await tx.$executeRawUnsafe(`UPDATE ${quoted(key)} SET ${keys.map((k,i)=>`${quoted(k)}=$${i+1}${cast(k)}`).join(',')},"updatedAt"=GREATEST(date_trunc('milliseconds',clock_timestamp()),"updatedAt" + interval '1 millisecond') WHERE id=$${params.length+1}::uuid AND "userId"=$${params.length+2}::uuid AND "updatedAt"=$${params.length+3}::timestamptz`,...params,id,ownerId,expectedUpdatedAt??'1970-01-01') : await tx.$executeRawUnsafe(`INSERT INTO ${quoted(key)} (${keys.map(quoted).join(',')},id,"userId","updatedAt") VALUES (${keys.map((k,i)=>`$${i+1}${cast(k)}`).join(',')},$${params.length+1}::uuid,$${params.length+2}::uuid,date_trunc('milliseconds',clock_timestamp()))`,...params,randomUUID(),ownerId);
    if(result!==1)throw Error('This record changed or is unavailable. Reload before editing.');
    if(seriesId){
     // The first occurrence above is included in the same transaction; mark it using a unique per-request title/date match is avoided by generating all remaining records explicitly.
     for(const dates of series.slice(1))await tx.$executeRawUnsafe('INSERT INTO "Event" (id,"userId",title,"startDate","endDate","startTime","endTime",location,"seriesId","updatedAt") VALUES($1::uuid,$2::uuid,$3,$4::date,$5::date,$6,$7,$8,$9::uuid,now())',randomUUID(),ownerId,values.title,dates.startDate,dates.endDate,values.startTime,values.endTime,values.location,seriesId);
    }
    await tx.auditLog.create({data:{userId:ownerId,action:`tracking.${key}.${id?'update':'create'}`,outcome:'success'}});
  });
}
export async function removeRecord(key:string,id:string,updatedAt:string) {
  entityFor(key);recordId.parse(id);
  return withCustomerDatabase(async(tx,ownerId)=>{
    let undoId:string|undefined;
    if(key==='Transaction'){
     const [current]=await tx.$queryRawUnsafe<{transferGroup:string|null}[]>('SELECT "transferGroup" FROM "Transaction" WHERE id=$1::uuid AND "userId"=$2::uuid AND "updatedAt"=$3::timestamptz FOR UPDATE',id,ownerId,updatedAt);
     if(!current)throw Error('Record changed. Reload before deleting.');
     if(current.transferGroup){const pair=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "Transaction" WHERE "userId"=$1::uuid AND "transferGroup"=$2::uuid ORDER BY id',ownerId,current.transferGroup);undoId=await keepDeletedTransactions(tx,ownerId,pair.map(r=>r.id));await tx.$executeRawUnsafe('DELETE FROM "Transaction" WHERE "userId"=$1::uuid AND "transferGroup"=$2::uuid',ownerId,current.transferGroup);await tx.auditLog.create({data:{userId:ownerId,action:'tracking.transfer.delete',outcome:'success'}});return {undoId};}
     undoId=await keepDeletedTransactions(tx,ownerId,[id]);
    }
    const result=await tx.$executeRawUnsafe(`DELETE FROM ${quoted(key)} WHERE id=$1::uuid AND "userId"=$2::uuid AND "updatedAt"=$3::timestamptz`,id,ownerId,updatedAt);
    if(result!==1)throw Error('This record changed or is unavailable. Reload before deleting.');
    await tx.auditLog.create({data:{userId:ownerId,action:`tracking.${key}.delete`,outcome:'success'}});return {undoId};
  });
}
export function moduleForEntity(key:string) {return entities.find(e=>e.key===key)?.module;}
export async function writeInlineNote(input:unknown,id:string,version:string){
 const values=validateRecord('Note',input);recordId.parse(id);
 return withCustomerDatabase(async(tx,owner)=>{
  const [previous]=await tx.$queryRawUnsafe<import('./config').RecordRow[]>('SELECT id,title,tag,content,"updatedAt"::text AS "baseVersion" FROM "Note" WHERE id=$1::uuid AND "userId"=$2::uuid AND "updatedAt"=$3::timestamptz FOR UPDATE',id,owner,version);
 if(!previous)throw Error('This note changed or is unavailable. Copy your changes, then reload.');
 await tx.$executeRawUnsafe(`INSERT INTO "WorkspaceState" (id,"userId",key,value,version,"updatedAt") VALUES ($1::uuid,$2::uuid,$3,$4::jsonb,1,now()) ON CONFLICT ("userId",key) DO UPDATE SET value=(SELECT jsonb_agg(item) FROM (SELECT item FROM jsonb_array_elements(EXCLUDED.value||"WorkspaceState".value) WITH ORDINALITY AS v(item,n) ORDER BY n LIMIT 10) latest),version="WorkspaceState".version+1,"updatedAt"=now()`,randomUUID(),owner,'note-history:'+id,JSON.stringify([{title:previous.title,tag:previous.tag,content:previous.content,baseVersion:previous.baseVersion,savedAt:new Date().toISOString()}]));
 const rows=await tx.$queryRawUnsafe<import('./config').RecordRow[]>('UPDATE "Note" SET title=$1,tag=$2,content=$3,"updatedAt"=GREATEST(date_trunc(\'milliseconds\',clock_timestamp()),"updatedAt"+interval \'1 millisecond\') WHERE id=$4::uuid AND "userId"=$5::uuid AND "updatedAt"=$6::timestamptz RETURNING id,title,tag,content,to_char("updatedAt" AT TIME ZONE \'UTC\',\'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"\') AS "updatedAt"',values.title,values.tag,values.content,id,owner,version);
  if(rows.length!==1)throw Error('This note changed or is unavailable. Copy your changes, then reload before saving.');
  await tx.auditLog.create({data:{userId:owner,action:'tracking.Note.update',outcome:'success'}});return rows[0];
 });
}
export async function readLinkedChoices(key:string,fieldName:string,search:string) {
 const entity=entityFor(key);const field=entity.fields.find(f=>f.name===fieldName&&f.target);if(!field||search.length>100)throw Error('Invalid linked-record search.');
 return withCustomerDatabase((tx,ownerId)=>tx.$queryRawUnsafe<{id:string;title:string;kind?:string}[]>(`SELECT id,title${field.target==='Category'?",kind":""} FROM "${field.target}" WHERE "userId"=$1::uuid AND title ILIKE $2 ORDER BY title,id LIMIT 50`,ownerId,`%${search.replace(/[\\%_]/g,'\\$&')}%`));
}
