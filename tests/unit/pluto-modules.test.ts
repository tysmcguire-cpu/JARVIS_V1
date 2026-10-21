import {beforeAll,afterAll,it,expect,vi} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {entities,moneyInput} from '@/features/tracking/config';
import {syntheticRecords} from '@/features/tracking/demo';
let database:PGlite;const alice=randomUUID(),bob=randomUUID();let actor=alice;
vi.mock('server-only',()=>({}));vi.mock('next/navigation',()=>({redirect:(to:string)=>{throw Error('redirect:'+to)}}));vi.mock('@/features/auth/server',()=>({requireCustomer:async()=>({id:actor,email_confirmed_at:'2026-01-01T00:00:00Z'})}));
vi.mock('@/lib/db',()=>({db:{$transaction:async(work:(tx:unknown)=>Promise<unknown>)=>database.transaction(async tx=>{
 await tx.exec('SET LOCAL ROLE pluto_app');
 return work({$queryRaw:async(strings:TemplateStringsArray,...args:unknown[])=>(await tx.query(strings.reduce((s,part,i)=>s+(i?'$'+i:'')+part,''),args)).rows,$queryRawUnsafe:async(sql:string,...args:unknown[])=>(await tx.query(sql,args)).rows,$executeRawUnsafe:async(sql:string,...args:unknown[])=>(await tx.query(sql,args)).affectedRows,auditLog:{create:({data}:{data:{userId:string;action:string;outcome:string}})=>tx.query('INSERT INTO "AuditLog"(id,"userId",action,outcome)VALUES($1,$2,$3,$4)',[randomUUID(),data.userId,data.action,data.outcome])}});
})}}));
import {writeRecord,readWorkspace,removeRecord} from '@/features/tracking/repository';
import {ownerExport,deleteOwnerAppData} from '@/features/data-controls/repository';
beforeAll(async()=>{database=new PGlite();await database.exec(`CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;INSERT INTO auth.users VALUES('${alice}'),('${bob}');`);for(const name of readdirSync('prisma/migrations').filter(n=>/^\d/.test(n)).sort())await database.exec(readFileSync('prisma/migrations/'+name+'/migration.sql','utf8'));for(const id of [alice,bob])await database.query('INSERT INTO "User"(id,"displayName","updatedAt")VALUES($1,$2,now())',[id,id===alice?'Alice synthetic':'Bob synthetic']);await database.exec(`INSERT INTO "UserSettings"("userId","updatedAt")SELECT id,now() FROM "User"`);},30000);
afterAll(async()=>database?.close());
const ids:Record<string,Record<string,string>>={[alice]:{},[bob]:{}};
it('uses every existing tracking repository for two independent customers',async()=>{
 const records=syntheticRecords();
 for(const id of [alice,bob]){actor=id;for(const entity of entities){const row=records[entity.key][0],input=Object.fromEntries(entity.fields.map(f=>[f.name,f.target?ids[id][f.target]:f.type==='money'?moneyInput(row[f.name]):row[f.name]]));input.title=(id===alice?'Alice ':'Bob ')+entity.key;if(entity.key==='Category')input.kind='expense';await writeRecord(entity.key,input);const view=await readWorkspace(entity.key,{search:input.title});expect(view.total,entity.key).toBe(1);expect(view.rows[0].title).toBe(input.title);ids[id][entity.key]=view.rows[0].id}}
},30000);
it('blocks cross-customer updates, deletes, references and export leakage',async()=>{
 actor=alice;await expect(writeRecord('Transaction',{title:'Forged',amount:'1.00',accountId:ids[bob].FinancialAccount,categoryId:ids[alice].Category,date:'2026-10-21'})).rejects.toThrow('unavailable');
 await expect(removeRecord('Note',ids[bob].Note,'2026-01-01T00:00:00Z')).rejects.toThrow();
 const snapshot=await ownerExport();expect(snapshot).toContain('Alice Note');expect(snapshot).not.toContain('Bob Note');expect(snapshot).not.toContain(bob);
 actor=bob;expect((await readWorkspace('Note',{})).rows.map(r=>r.title)).toEqual(['Bob Note']);
});
it('erases one workspace, keeps a tombstone and blocks recreation without affecting another customer',async()=>{
 actor=alice;await deleteOwnerAppData('DELETE MY PLUTO DATA');await expect(readWorkspace('Note',{})).rejects.toThrow('unavailable');expect((await database.query<{status:string}>('SELECT status FROM "User" WHERE id=$1',[alice])).rows[0].status).toBe('deleted');expect((await database.query('SELECT * FROM "CustomerErasure" WHERE "userId"=$1',[alice])).rows).toHaveLength(1);for(const e of entities)expect((await database.query(`SELECT id FROM "${e.key}" WHERE "userId"=$1`,[alice])).rows,e.key).toHaveLength(0);
 actor=bob;expect((await readWorkspace('Note',{})).rows.map(r=>r.title)).toEqual(['Bob Note']);expect((await database.query('SELECT * FROM auth.users')).rows).toHaveLength(2);
});
