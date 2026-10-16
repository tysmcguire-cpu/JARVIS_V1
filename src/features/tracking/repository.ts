import 'server-only';
import { randomUUID } from 'node:crypto';
import { withOwnerDatabase } from '@/lib/owner-db';
import { entities, entityFor, formatMoney, type RecordRow, type WorkspaceData } from './config';
import { readQuery, recordId, validateRecord } from './validation';
const quoted = (name: string) => `"${name}"`; // Names come exclusively from the static entity definitions.
function serialize(row: Record<string, unknown>): RecordRow { return Object.fromEntries(Object.entries(row).map(([key,value]) => [key, value instanceof Date ? value.toISOString().slice(0,key === 'updatedAt' ? 24 : 10) : String(value ?? '')])) as RecordRow; }
export async function readWorkspace(key: string, input: unknown): Promise<WorkspaceData> {
  const entity = entityFor(key); const query = readQuery(input); const pageSize = 4;
  return withOwnerDatabase(async (tx, ownerId) => {
    const params: unknown[] = [ownerId]; let where = '"userId"=$1::uuid';
    if (query.search) { params.push(`%${query.search.replace(/[\\%_]/g,'\\$&')}%`); where += ` AND "title" ILIKE $${params.length}`; }
    if (query.status && entity.fields.some(f => f.name === 'status')) { params.push(query.status); where += ` AND "status"=$${params.length}`; }
    const dateField = entity.fields.find(f => f.type === 'date');
    const sort = query.sort === 'date' ? dateField?.name ?? 'updatedAt' : query.sort;
    const count = await tx.$queryRawUnsafe<{count: bigint}[]>(`SELECT count(*) FROM ${quoted(key)} WHERE ${where}`, ...params);
    const total = Number(count[0].count); const page = Math.min(query.page, Math.max(1,Math.ceil(total/pageSize)));
    const records = await tx.$queryRawUnsafe<Record<string,unknown>[]>(`SELECT * FROM ${quoted(key)} WHERE ${where} ORDER BY ${quoted(sort)} ${query.direction === 'asc'?'ASC':'DESC'}, "id" LIMIT ${pageSize} OFFSET ${(page-1)*pageSize}`, ...params);
    const options: WorkspaceData['options'] = {}; let relationsTruncated = false;
    for (const target of new Set(entity.fields.filter(f => f.target).map(f => f.target!))) {
      const rows = await tx.$queryRawUnsafe<{id:string; title:string}[]>(`SELECT "id", "title" FROM ${quoted(target)} WHERE "userId"=$1::uuid ORDER BY "title", "id" LIMIT 501`,ownerId);
      if(rows.length > 500) relationsTruncated = true; options[target]=rows.slice(0,500);
      // Always include links of the current records even beyond the first 500 options.
      const ids = entity.fields.filter(f => f.target === target).flatMap(f => records.map(r=>String(r[f.name])));
      for (const id of new Set(ids)) if(!options[target].some(r=>r.id===id)) {
        const linked = await tx.$queryRawUnsafe<{id:string;title:string}[]>(`SELECT "id", "title" FROM ${quoted(target)} WHERE "userId"=$1::uuid AND "id"=$2::uuid`,ownerId,id); options[target].push(...linked);
      }
    }
    for(const row of records) {
      const target=entity.fields.some(f=>f.name==='accountId')?'FinancialAccount':entity.fields.some(f=>f.name==='budgetId')?'Budget':null;
      if(target) {const parentId=row[target==='Budget'?'budgetId':'accountId'];const parent=await tx.$queryRawUnsafe<{currency:string}[]>(`SELECT currency FROM "${target}" WHERE id=$1::uuid AND "userId"=$2::uuid`,parentId,ownerId);row.currency=parent[0]?.currency;}
    }
    const summary: WorkspaceData['summary']=[{label:'Matching records',value:String(total)}]; let chart: WorkspaceData['chart']=[];
    if(entity.fields.some(f=>f.name==='status')) {
      const statuses = await tx.$queryRawUnsafe<{label:string;value:bigint}[]>(`SELECT "status" AS label, count(*) AS value FROM ${quoted(key)} WHERE ${where} GROUP BY "status" ORDER BY "status"`,...params); chart=statuses.map(r=>({label:r.label,value:Number(r.value)}));
      summary.push({label:'Completed',value:String(chart.find(c=>c.label==='done')?.value??0)});
    }
    if(entity.module==='finances') {
      const balances=await tx.$queryRawUnsafe<{currency:string;balance:bigint}[]>(`SELECT a.currency, sum(a."openingBalance" + COALESCE(t.net,0))::bigint AS balance FROM "FinancialAccount" a LEFT JOIN (SELECT t."accountId",t."userId",sum(CASE WHEN c.kind='income' THEN t.amount ELSE -t.amount END) AS net FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" WHERE t."userId"=$1::uuid GROUP BY t."accountId",t."userId") t ON t."accountId"=a.id AND t."userId"=a."userId" WHERE a."userId"=$1::uuid GROUP BY a.currency ORDER BY a.currency`,ownerId);
      summary.push(...balances.map(r=>({label:'Account balance',value:formatMoney(r.balance,r.currency)})));
      const spending = await tx.$queryRawUnsafe<{label:string;value:bigint}[]>(`SELECT a.currency || ' · ' || c.title AS label, sum(t.amount)::bigint AS value FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" JOIN "FinancialAccount" a ON a.id=t."accountId" AND a."userId"=t."userId" WHERE t."userId"=$1::uuid AND c.kind='expense' GROUP BY a.currency,c.title ORDER BY sum(t.amount) DESC LIMIT 6`,ownerId);
      chart=spending.map(r=>({label:r.label+' · '+formatMoney(r.value,r.label.slice(0,3)),value:Number(r.value)/100}));
    }
    if(entity.module==='education') {
      const grade=await tx.$queryRawUnsafe<{earned:bigint|null;possible:bigint|null}[]>('SELECT sum("pointsEarned")::bigint AS earned,sum("pointsPossible")::bigint AS possible FROM "Grade" WHERE "userId"=$1::uuid',ownerId);
      if(grade[0].possible)summary.push({label:'Recorded points (unweighted)',value:`${(Number(grade[0].earned)/Number(grade[0].possible)*100).toFixed(1)}%`});
    }
    if(key==='Goal')chart=records.map(r=>({label:String(r.title),value:Math.min(100,Number(r.current)/Number(r.target)*100)}));
    if(key==='BudgetCategory') {
      for(const record of records) {
        const spent=await tx.$queryRawUnsafe<{spent:bigint;currency:string}[]>(`SELECT b.currency,COALESCE(sum(CASE WHEN a.currency=b.currency THEN t.amount ELSE 0 END),0)::bigint AS spent FROM "Budget" b LEFT JOIN "Transaction" t ON t."userId"=b."userId" AND t."categoryId"=$3::uuid AND t.date BETWEEN b."startDate" AND b."endDate" LEFT JOIN "FinancialAccount" a ON a.id=t."accountId" AND a."userId"=b."userId" WHERE b.id=$2::uuid AND b."userId"=$1::uuid GROUP BY b.currency`,ownerId,record.budgetId,record.categoryId);
        summary.push({label:`Spent · ${String(record.title)}`,value:formatMoney(spent[0]?.spent??0n,spent[0]?.currency??'USD')});
      }
    }
    const calendar: WorkspaceData['calendar']=[];
    if(dateField) { const dated=await tx.$queryRawUnsafe<{date:Date;title:string}[]>(`SELECT ${quoted(dateField.name)} AS date,title FROM ${quoted(key)} WHERE ${where} AND ${quoted(dateField.name)} >= $${params.length+1}::date AND ${quoted(dateField.name)} < ($${params.length+1}::date + interval '1 month') ORDER BY ${quoted(dateField.name)},id LIMIT 200`,...params,query.month+'-01');calendar.push(...dated.map(r=>({date:r.date.toISOString().slice(0,10),title:r.title}))); }
    return {rows:records.map(serialize),total,page,pageSize,options,relationsTruncated,summary:summary.slice(0,5),chart,calendar};
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
