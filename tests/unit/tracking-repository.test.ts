import { beforeAll,afterAll,describe,it,expect,vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { entities } from '@/features/tracking/config';
let database:PGlite;let reads=0;
const owner='a2c92111-c2a3-4ab2-91dc-3d1abc84cc33';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/customer-db',()=>({withCustomerDatabase:async(callback:(tx:unknown,id:string)=>Promise<unknown>)=>database.transaction(async transaction=>{
 await transaction.exec(`SET LOCAL ROLE runtime;SET LOCAL request.jwt.claim.sub='${owner}'`);
 const adapter={
 $queryRawUnsafe:async(sql:string,...args:unknown[])=>{reads++;return (await transaction.query(sql,args)).rows},
 $executeRawUnsafe:async(sql:string,...args:unknown[])=>(await transaction.query(sql,args)).affectedRows,
 auditLog:{create:async({data}:{data:{userId:string;action:string;outcome:string}})=>transaction.query('INSERT INTO "AuditLog"(id,"userId",action,outcome)VALUES($1,$2,$3,$4)',[randomUUID(),data.userId,data.action,data.outcome])}
 };return callback(adapter,owner);
})}));
import { writeRecord,readWorkspace,removeRecord,readLinkedChoices,writeInlineNote } from '@/features/tracking/repository';
import {writeBudget,removeBudget} from '@/features/tracking/budget-repository';
describe('actual tracking repository against PostgreSQL',()=>{
 it('creates, searches, updates with concurrency control, and deletes',async()=>{
 await writeRecord('Note',{title:'100% real title',content:'First','tag':'test'});let view=await readWorkspace('Note',{search:'%'});expect(view.total).toBe(1);const row=view.rows[0];await writeRecord('Note',{title:'Edited',content:'Second','tag':'test'},row.id,row.updatedAt);await expect(writeRecord('Note',{title:'Stale',content:'','tag':''},row.id,row.updatedAt)).rejects.toThrow('changed');view=await readWorkspace('Note',{});expect(view.rows[0].title).toBe('Edited');await removeRecord('Note',row.id,view.rows[0].updatedAt);expect((await readWorkspace('Note',{})).total).toBe(0);expect((await database.query('SELECT * FROM "AuditLog"')).rows).toHaveLength(3);
 });
 it('calculates currency-separated balances and budget spending from persisted links',async()=>{
 await writeRecord('FinancialAccount',{title:'USD account',currency:'USD',openingBalance:'100.00'});const account=(await readWorkspace('FinancialAccount',{})).rows[0];await writeRecord('Category',{title:'Food',kind:'expense'});const category=(await readWorkspace('Category',{})).rows[0];await writeRecord('Transaction',{title:'Lunch',accountId:account.id,categoryId:category.id,amount:'0.30',date:'2026-10-15'});await expect(writeRecord('FinancialAccount',{title:'USD account',currency:'EUR',openingBalance:'100.00'},account.id,account.updatedAt)).rejects.toThrow('currency');expect(await readLinkedChoices('Transaction','accountId','USD')).toHaveLength(1);await expect(readLinkedChoices('Transaction','userId','')).rejects.toThrow('Invalid');let view=await readWorkspace('Transaction',{month:'2026-10'});expect(view.summary).toContainEqual({label:'Account balance',value:'USD 99.70'});expect(view.calendar).toHaveLength(1);await writeRecord('Budget',{title:'October',currency:'USD',startDate:'2026-10-01',endDate:'2026-10-31'});const budget=(await readWorkspace('Budget',{})).rows[0];await writeRecord('BudgetCategory',{title:'Food limit',budgetId:budget.id,categoryId:category.id,limitAmount:'20.00'});view=await readWorkspace('BudgetCategory',{});expect(view.summary).toContainEqual({label:'Spent · Food limit',value:'USD 0.30'});await expect(removeRecord('FinancialAccount',account.id,account.updatedAt)).rejects.toThrow();
 });
 it('paginates and bounds queries without trusting identifiers',async()=>{for(let i=0;i<5;i++)await writeRecord('Note',{title:'Sample '+i,content:'','tag':''});const page=await readWorkspace('Note',{page:2,sort:'title',direction:'asc'});expect(page.total).toBe(5);expect(page.rows).toHaveLength(1);await expect(readWorkspace('User',{})).rejects.toThrow('Unknown');});
 it('loads every record type in one round trip and clamps out-of-range pages',async()=>{for(const entity of entities){reads=0;const result=await readWorkspace(entity.key,{page:999});expect(reads).toBe(1);expect(result.page).toBeLessThanOrEqual(Math.max(1,Math.ceil(result.total/4)));expect(result.rows.length).toBeLessThanOrEqual(4)}});
 it('retains selected links beyond the bounded choice list',async()=>{await database.query('INSERT INTO "Category"(id,"userId",title,kind,"updatedAt") SELECT gen_random_uuid(),$1,\'Synthetic choice \'||lpad(n::text,4,\'0\'),\'expense\',now() FROM generate_series(1,502) n',[owner]);const linked=(await database.query<{id:string}>('INSERT INTO "Category"(id,"userId",title,kind,"updatedAt")VALUES(gen_random_uuid(),$1,\'ZZZ selected beyond 500\',\'expense\',now())RETURNING id',[owner])).rows[0].id;const account=(await readWorkspace('FinancialAccount',{})).rows[0].id;await writeRecord('Transaction',{title:'Linked beyond limit',accountId:account,categoryId:linked,amount:'0.10',date:'2026-10-16'});const view=await readWorkspace('Transaction',{search:'Linked beyond'});expect(view.relationsTruncated).toBe(true);expect(view.options.Category.some(c=>c.id===linked)).toBe(true);expect(view.rows[0].currency).toBe('USD')});
it('summarizes the entire filtered task set with workspace-local dates, independent of pagination',async()=>{
 const first=await readWorkspace('Task',{}),today=first.today!;const previous=new Date(today+'T12:00:00Z');previous.setUTCDate(previous.getUTCDate()-1);const yesterday=previous.toISOString().slice(0,10);
 for(let i=0;i<6;i++)await writeRecord('Task',{title:'Metric task '+i,dueDate:i<2?yesterday:today,status:i===0?'done':i===1?'active':'planned',priority:'normal'});
 const data=await readWorkspace('Task',{search:'Metric task',page:2});expect(data.rows).toHaveLength(2);expect(data.summary).toContainEqual({label:'Tasks',value:'6'});expect(data.summary).toContainEqual({label:'Upcoming / open',value:'4'});expect(data.summary).toContainEqual({label:'Past due / not done',value:'1'});expect(data.summary).toContainEqual({label:'Completed',value:'1'});
 const filtered=await readWorkspace('Task',{search:'Metric task',status:'done'});expect(filtered.summary).toContainEqual({label:'Tasks',value:'1'});expect(filtered.summary).toContainEqual({label:'Past due / not done',value:'0'});
 const accounts=await readWorkspace('FinancialAccount',{});expect(accounts.rows[0].currentBalance).toBe('9960');const transactions=await readWorkspace('Transaction',{});expect(transactions.rows[0].categoryKind).toBe('expense');
});


it('aggregates monthly charts across all pages, excludes income from spending, and isolates currencies',async()=>{
 const account=(await readWorkspace('FinancialAccount',{})).rows[0],food=(await readLinkedChoices('Transaction','categoryId','Food'))[0];await writeRecord('Category',{title:'Metric income',kind:'income'});const income=(await readLinkedChoices('Transaction','categoryId','Metric income'))[0];
 for(let i=0;i<5;i++)await writeRecord('Transaction',{title:'Metric finance '+i,accountId:account.id,categoryId:food.id,amount:'0.10',date:'2026-10-19'});await writeRecord('Transaction',{title:'Metric finance salary',accountId:account.id,categoryId:income.id,amount:'400.00',date:'2026-10-19'});
 const query={search:'Metric finance',month:'2026-10',period:true,currency:'USD'};const view=await readWorkspace('Transaction',query);expect(view.rows).toHaveLength(4);expect(view.total).toBe(6);expect(view.finance?.income).toBe('40000');expect(view.finance?.expense).toBe('50');expect(view.finance?.balance).toBe('49910');expect(view.finance?.pie).toEqual([{label:'Food',minor:'50'}]);expect(view.finance?.daily.find(p=>p.date==='2026-10-19')?.minor).toBe('50');expect((await readWorkspace('Transaction',{...query,page:2})).finance).toEqual(view.finance);
 await writeRecord('FinancialAccount',{title:'EUR chart account',currency:'EUR',openingBalance:'0'});const euro=(await readLinkedChoices('Transaction','accountId','EUR chart account'))[0];await writeRecord('Transaction',{title:'Metric finance euro',accountId:euro.id,categoryId:food.id,amount:'100.00',date:'2026-10-19'});expect((await readWorkspace('Transaction',query)).finance).toEqual(view.finance);expect((await readWorkspace('Transaction',{...query,currency:'EUR'})).finance?.expense).toBe('10000');const initial=await readWorkspace('Transaction',{period:true});expect(initial.finance?.month).toBe(initial.today?.slice(0,7));const empty=await readWorkspace('Transaction',{month:'2025-02',period:true,currency:'USD'});expect(empty.total).toBe(0);expect(empty.finance?.daily).toHaveLength(28);expect(empty.finance?.pie).toEqual([]);
});

it('combines exact account balances and allocated budget spending in a bounded currency-scoped general snapshot',async()=>{
 const data=await readWorkspace('Transaction',{month:'2026-10',period:true,currency:'USD',search:'no such transaction'});expect(data.rows).toHaveLength(0);expect(data.general?.accounts).toMatchObject([{title:'USD account',balance:'49910',currency:'USD'}]);expect(data.general?.budgets).toMatchObject([{title:'October',spent:'80',limit:'2000',limitCount:1}]);const euro=await readWorkspace('Transaction',{month:'2026-10',currency:'EUR'});expect(euro.general?.accounts[0].balance).toBe('-10000');expect(euro.general?.budgets).toEqual([]);
 for(let i=0;i<4;i++){await writeRecord('FinancialAccount',{title:'General account '+i,currency:'USD',openingBalance:'0'});await writeRecord('Budget',{title:'General budget '+i,currency:'USD',startDate:'2026-10-01',endDate:'2026-10-31'})}const full=await readWorkspace('Transaction',{month:'2026-10',currency:'USD'});expect(full.general?.accountTotal).toBe(5);expect(full.general?.budgetTotal).toBe(5);expect(full.general?.accounts).toHaveLength(3);expect(full.general?.budgets).toHaveLength(3);expect(full.general?.budgets.find(b=>b.title==='General budget 0')).toMatchObject({limitCount:0,spent:'0',limit:'0'});
});
it('makes every saved assignment reachable with six-row pagination and stable ordering',async()=>{
 await writeRecord('Course',{title:'Assignment pagination course',code:'PAG 101',term:'Fall',instructor:''});const course=(await readLinkedChoices('Assignment','courseId','Assignment pagination course'))[0];
 for(let i=0;i<14;i++)await writeRecord('Assignment',{title:'Pagination assignment '+String(i).padStart(2,'0'),courseId:course.id,dueDate:'2026-10-25',status:'planned',pointsPossible:'100'});
 const ids=new Set<string>();for(let page=1;page<=3;page++){const data=await readWorkspace('Assignment',{search:'Pagination assignment',sort:'title',direction:'asc',page});expect(data.total).toBe(14);expect(data.pageSize).toBe(6);expect(data.rows).toHaveLength(page===3?2:6);data.rows.forEach(r=>ids.add(r.id))}expect(ids.size).toBe(14);expect((await readWorkspace('Assignment',{search:'Pagination assignment',page:999})).page).toBe(3);
});

 it('reads per-account balance history from the whole ledger without future points or currency mixing',async()=>{
  await writeRecord('FinancialAccount',{title:'History EUR',currency:'EUR',openingBalance:'-1.00'});const account=(await readWorkspace('FinancialAccount',{search:'History EUR',month:'2000-02'})).rows[0];
  await writeRecord('Category',{title:'History income',kind:'income'});await writeRecord('Category',{title:'History expense',kind:'expense'});const income=(await readWorkspace('Category',{search:'History income'})).rows[0],expense=(await readWorkspace('Category',{search:'History expense'})).rows[0];
  for(const [date,amount,categoryId] of [['2000-01-01','0.10',income.id],['2000-02-01','0.20',income.id],['2000-02-02','0.30',expense.id],['2000-03-01','999',income.id]])await writeRecord('Transaction',{title:'History event',date,amount,categoryId,accountId:account.id});
  const result=await readWorkspace('FinancialAccount',{search:'History EUR',month:'2000-02'}),history=result.accountHistory![0];expect(history.opening).toBe('-90');expect(history.points).toHaveLength(30);expect(history.points.slice(0,3)).toEqual([{date:'2000-01-31',balance:'-90'},{date:'2000-02-01',balance:'-70'},{date:'2000-02-02',balance:'-100'}]);expect(history.points.at(-1)).toEqual({date:'2000-02-29',balance:'-100'});expect((await readWorkspace('FinancialAccount',{search:'History EUR',month:'9999-01'})).accountHistory![0].points).toEqual([]);
 });
 it('saves monthly budgets atomically, reuses normalized expense categories, and preserves legacy periods on edit',async()=>{
  await writeBudget({title:'Groceries budget',category:'  Groceries   home  ',limit:'25.10',month:'2026-10',currency:'USD'});
  const view=await readWorkspace('BudgetCategory',{search:'Groceries budget',period:true,month:'2026-10',currency:'USD'}),row=view.rows[0];
  expect(row).toMatchObject({title:'Groceries budget',categoryTitle:'Groceries home',limitAmount:'2510',spent:'0',startDate:'2026-10-01',endDate:'2026-10-31',currency:'USD'});
  await writeBudget({title:'Household budget',category:'groceries home',limit:'30',month:'2026-11',currency:'USD'});
  expect((await readWorkspace('Category',{search:'Groceries home'})).total).toBe(1);
  await expect(writeRecord('Category',{title:' GROCERIES   HOME ',kind:'expense'})).rejects.toThrow('already exists');
  await writeBudget({title:'Groceries revised',category:'Groceries home',limit:'40',month:'2026-11',currency:'EUR'},row.id,row.updatedAt);
  const revised=(await readWorkspace('BudgetCategory',{search:'Groceries revised'})).rows[0];expect(revised).toMatchObject({limitAmount:'4000',startDate:'2026-10-01',endDate:'2026-10-31',currency:'USD'});
  await expect(writeBudget({title:'Stale',category:'Must roll back',limit:'99',month:'2026-10',currency:'USD'},row.id,row.updatedAt)).rejects.toThrow('changed');
  expect((await readWorkspace('Category',{search:'Must roll back'})).total).toBe(0);
  expect((await readWorkspace('BudgetCategory',{search:'Groceries revised',period:true,month:'2026-11',currency:'USD'})).total).toBe(0);
  expect((await readWorkspace('BudgetCategory',{search:'Groceries revised',period:true,month:'2026-10',currency:'EUR'})).total).toBe(0);
  const account=(await readWorkspace('FinancialAccount',{search:'USD account'})).rows[0];
  for(const [date,amount] of [['2026-10-01','0.10'],['2026-10-31','0.20'],['2026-11-01','999']])await writeRecord('Transaction',{title:'Budget spending fixture',accountId:account.id,categoryId:row.categoryId,amount,date});
  expect((await readWorkspace('BudgetCategory',{search:'Groceries revised'})).rows[0].spent).toBe('30');
  await expect(writeBudget({title:'Bad',category:'Bad',limit:'-1',month:'2026-10',currency:'USD'})).rejects.toThrow();
  await expect(removeBudget(row.id,row.updatedAt)).rejects.toThrow('changed');
  await removeBudget(revised.id,revised.updatedAt);
  expect((await readWorkspace('BudgetCategory',{search:'Groceries revised'})).total).toBe(0);
  expect((await readWorkspace('Budget',{search:'Groceries revised'})).total).toBe(0);
  expect((await readWorkspace('Category',{search:'Groceries home'})).total).toBe(1);
 });
 beforeAll(async()=>{database=new PGlite();await database.exec(`CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE runtime;GRANT USAGE ON SCHEMA public,auth TO runtime;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;INSERT INTO auth.users VALUES('${owner}');`);await database.exec(readFileSync('prisma/migrations/20261015000000_foundation/migration.sql','utf8'));await database.exec(readFileSync('prisma/migrations/20261016000000_core_tracking/migration.sql','utf8'));await database.exec(readFileSync('prisma/migrations/20261021000000_productivity/migration.sql','utf8'));await database.exec(readFileSync('prisma/migrations/20261021010000_note_capacity/migration.sql','utf8'));await database.exec(readFileSync('prisma/migrations/20261016020000_integrations/migration.sql','utf8'));await database.exec(`GRANT SELECT ON "ApiConnection","ExternalRecord","UserSettings" TO runtime;INSERT INTO "User"(id,"updatedAt")VALUES('${owner}',now());GRANT SELECT,INSERT,UPDATE,DELETE ON "WorkspaceState",${entities.map(e=>'"'+e.key+'"').join(',')} TO runtime;GRANT INSERT ON "AuditLog" TO runtime;`);},30000);
 afterAll(async()=>database?.close());

 it('persists inline note formatting atomically and preserves stale drafts without overwriting newer content',async()=>{
  await writeRecord('Note',{title:'Inline database note',content:'Original',tag:'work'});const original=(await readWorkspace('Note',{search:'Inline database note'})).rows[0];
  const updated=await writeInlineNote({title:'Inline database note',content:'## Heading\n\n**Bold** and *italic*\n\n- Item',tag:'edited'},original.id,original.updatedAt);expect(updated.content).toContain('**Bold**');expect(updated.updatedAt).not.toBe(original.updatedAt);
  await expect(writeInlineNote({title:'Stale',content:'Must not replace',tag:''},original.id,original.updatedAt)).rejects.toThrow('changed');
  await database.exec('REVOKE INSERT ON "AuditLog" FROM runtime');await expect(writeInlineNote({title:'Inline database note',content:'Must roll back',tag:''},updated.id,updated.updatedAt)).rejects.toThrow();await database.exec('GRANT INSERT ON "AuditLog" TO runtime');expect((await readWorkspace('Note',{search:'Inline database note'})).rows[0].content).toBe(updated.content);
  const long=await writeInlineNote({title:'Inline database note',content:'x'.repeat(32000),tag:''},updated.id,updated.updatedAt);expect(long.content).toHaveLength(32000);await expect(writeInlineNote({title:'Inline database note',content:'x'.repeat(32001),tag:''},long.id,long.updatedAt)).rejects.toThrow('32000');
 });

});
