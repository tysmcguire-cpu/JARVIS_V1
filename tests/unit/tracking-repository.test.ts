import { beforeAll,afterAll,describe,it,expect,vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { entities } from '@/features/tracking/config';
let database:PGlite;
const owner='a2c92111-c2a3-4ab2-91dc-3d1abc84cc33';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/owner-db',()=>({withOwnerDatabase:async(callback:(tx:unknown,id:string)=>Promise<unknown>)=>database.transaction(async transaction=>{
 await transaction.exec(`SET LOCAL ROLE runtime;SET LOCAL request.jwt.claim.sub='${owner}'`);
 const adapter={
 $queryRawUnsafe:async(sql:string,...args:unknown[])=>(await transaction.query(sql,args)).rows,
 $executeRawUnsafe:async(sql:string,...args:unknown[])=>(await transaction.query(sql,args)).affectedRows,
 auditLog:{create:async({data}:{data:{userId:string;action:string;outcome:string}})=>transaction.query('INSERT INTO "AuditLog"(id,"userId",action,outcome)VALUES($1,$2,$3,$4)',[randomUUID(),data.userId,data.action,data.outcome])}
 };return callback(adapter,owner);
})}));
import { writeRecord,readWorkspace,removeRecord,readLinkedChoices } from '@/features/tracking/repository';
describe('actual tracking repository against PostgreSQL',()=>{
 beforeAll(async()=>{database=new PGlite();await database.exec(`CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE runtime;GRANT USAGE ON SCHEMA public,auth TO runtime;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;INSERT INTO auth.users VALUES('${owner}');`);await database.exec(readFileSync('prisma/migrations/20261015000000_foundation/migration.sql','utf8'));await database.exec(readFileSync('prisma/migrations/20261016000000_core_tracking/migration.sql','utf8'));await database.exec(`INSERT INTO "User"(id,"updatedAt")VALUES('${owner}',now());GRANT SELECT,INSERT,UPDATE,DELETE ON ${entities.map(e=>'"'+e.key+'"').join(',')} TO runtime;GRANT INSERT ON "AuditLog" TO runtime;`);},30000);
 afterAll(async()=>database?.close());
 it('creates, searches, updates with concurrency control, and deletes',async()=>{
 await writeRecord('Note',{title:'100% real title',content:'First','tag':'test'});let view=await readWorkspace('Note',{search:'%'});expect(view.total).toBe(1);const row=view.rows[0];await writeRecord('Note',{title:'Edited',content:'Second','tag':'test'},row.id,row.updatedAt);await expect(writeRecord('Note',{title:'Stale',content:'','tag':''},row.id,row.updatedAt)).rejects.toThrow('changed');view=await readWorkspace('Note',{});expect(view.rows[0].title).toBe('Edited');await removeRecord('Note',row.id,view.rows[0].updatedAt);expect((await readWorkspace('Note',{})).total).toBe(0);expect((await database.query('SELECT * FROM "AuditLog"')).rows).toHaveLength(3);
 });
 it('calculates currency-separated balances and budget spending from persisted links',async()=>{
 await writeRecord('FinancialAccount',{title:'USD account',currency:'USD',openingBalance:'100.00'});const account=(await readWorkspace('FinancialAccount',{})).rows[0];await writeRecord('Category',{title:'Food',kind:'expense'});const category=(await readWorkspace('Category',{})).rows[0];await writeRecord('Transaction',{title:'Lunch',accountId:account.id,categoryId:category.id,amount:'0.30',date:'2026-10-15'});await expect(writeRecord('FinancialAccount',{title:'USD account',currency:'EUR',openingBalance:'100.00'},account.id,account.updatedAt)).rejects.toThrow('currency');expect(await readLinkedChoices('Transaction','accountId','USD')).toHaveLength(1);await expect(readLinkedChoices('Transaction','userId','')).rejects.toThrow('Invalid');let view=await readWorkspace('Transaction',{month:'2026-10'});expect(view.summary).toContainEqual({label:'Account balance',value:'USD 99.70'});expect(view.calendar).toHaveLength(1);await writeRecord('Budget',{title:'October',currency:'USD',startDate:'2026-10-01',endDate:'2026-10-31'});const budget=(await readWorkspace('Budget',{})).rows[0];await writeRecord('BudgetCategory',{title:'Food limit',budgetId:budget.id,categoryId:category.id,limitAmount:'20.00'});view=await readWorkspace('BudgetCategory',{});expect(view.summary).toContainEqual({label:'Spent · Food limit',value:'USD 0.30'});await expect(removeRecord('FinancialAccount',account.id,account.updatedAt)).rejects.toThrow();
 });
 it('paginates and bounds queries without trusting identifiers',async()=>{for(let i=0;i<5;i++)await writeRecord('Note',{title:'Sample '+i,content:'','tag':''});const page=await readWorkspace('Note',{page:2,sort:'title',direction:'asc'});expect(page.total).toBe(5);expect(page.rows).toHaveLength(1);await expect(readWorkspace('User',{})).rejects.toThrow('Unknown');});
});
