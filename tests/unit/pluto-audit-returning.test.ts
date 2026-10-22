import {beforeAll,afterAll,it,expect} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
let db:PGlite;const alice=randomUUID(),bob=randomUUID();
const migration='20261022090000_pluto_audit_self_read';
async function customer<T>(id:string,sql:string,args:unknown[]=[]){return db.transaction(async tx=>{await tx.exec('SET LOCAL ROLE pluto_app');await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[id]);return (await tx.query<T>(sql,args)).rows})}
const insert='INSERT INTO "AuditLog"(id,"userId",action,outcome)VALUES(gen_random_uuid(),$1::uuid,\'customer.onboarding\',\'success\')RETURNING id,"userId",action';
beforeAll(async()=>{
 db=new PGlite();await db.exec(`CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
 for(const dir of readdirSync('prisma/migrations').filter(n=>/^\d/.test(n)&&n!==migration).sort())await db.exec(readFileSync(`prisma/migrations/${dir}/migration.sql`,'utf8'));
 for(const id of [alice,bob]){await db.query('INSERT INTO auth.users VALUES($1)',[id]);await db.query('INSERT INTO "User"(id,"updatedAt")VALUES($1,now())',[id])}
},30000);
afterAll(async()=>{await db?.close()});
it('reproduces the onboarding INSERT RETURNING rejection before the missing policy is installed',async()=>{
 await expect(customer(alice,insert,[alice])).rejects.toThrow('row-level security');expect((await db.query('SELECT * FROM "AuditLog"')).rows).toHaveLength(0);
 await db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`,'utf8'));
});
it('permits own audit INSERT RETURNING and reads while hiding other customers and inactive accounts',async()=>{
 const a=await customer<{id:string;userId:string}>(alice,insert,[alice]),b=await customer<{id:string;userId:string}>(bob,insert,[bob]);expect(a[0].userId).toBe(alice);expect(b[0].userId).toBe(bob);
 expect((await customer<{userId:string}>(alice,'SELECT "userId" FROM "AuditLog"')).map(r=>r.userId)).toEqual([alice]);
 expect((await customer(bob,'SELECT * FROM "AuditLog" WHERE id=$1',[a[0].id]))).toEqual([]);
 await expect(customer(alice,insert,[bob])).rejects.toThrow('row-level security');
 await db.query('UPDATE "User" SET status=\'suspended\' WHERE id=$1',[alice]);expect(await customer(alice,'SELECT * FROM "AuditLog"')).toEqual([]);
 await expect(customer(alice,insert,[alice])).rejects.toThrow('row-level security');
 await db.query('UPDATE "User" SET status=\'active\' WHERE id=$1',[alice]);
});
it('does not grant audit modification/deletion or browser access',async()=>{
 await expect(customer(alice,'UPDATE "AuditLog" SET action=\'customer.changed\'')).rejects.toThrow('permission denied');await expect(customer(alice,'DELETE FROM "AuditLog"')).rejects.toThrow('permission denied');
 for(const role of ['anon','authenticated'])await expect(db.transaction(async tx=>{await tx.exec('SET LOCAL ROLE '+role);return tx.query('SELECT * FROM "AuditLog"')})).rejects.toThrow('permission denied');
});
