import {beforeAll,afterAll,it,expect} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import {roleSql,runtimeRoles,assertMigrationDestination,setup} from '../../scripts/pluto-setup-lib';
let db:PGlite;
beforeAll(async()=>{
 db=new PGlite();await db.exec("CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;");
 // Model Supabase's default explicit browser grants, rather than only PUBLIC.
 await db.exec('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated;');
 for(const dir of readdirSync('prisma/migrations').filter(n=>/^\d/.test(n)).sort())await db.exec(readFileSync(`prisma/migrations/${dir}/migration.sql`,'utf8'));
 for(const key of Object.keys(runtimeRoles) as (keyof typeof runtimeRoles)[])await db.exec(roleSql(key,'synthetic-test-only-password'));
},30000);
afterAll(async()=>{await db?.close()});
it('all customer-owned tables force RLS and browser roles have no public application table privileges',async()=>{
 const exposed=await db.query<{relname:string}>(`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attname='userId') AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity)`);expect(exposed.rows).toEqual([]);
 const grants=await db.query(`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND (has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') OR has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE'))`);expect(grants.rows).toEqual([]);
});
it('all public security definer functions fix search_path and deny browser execution',async()=>{
 const unsafe=await db.query(`SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef AND (NOT COALESCE(p.proconfig @> ARRAY['search_path=pg_catalog, public'],false) OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))`);expect(unsafe.rows).toEqual([]);
});
it('provisioned logins inherit exactly one intended group with no ownership or elevated attributes',async()=>{
 for(const r of Object.values(runtimeRoles)){
  const row=(await db.query<{rolsuper:boolean;rolcreatedb:boolean;rolcreaterole:boolean;rolreplication:boolean;rolbypassrls:boolean;rolcanlogin:boolean;rolconnlimit:number}>('SELECT rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,rolcanlogin,rolconnlimit FROM pg_roles WHERE rolname=$1',[r.login])).rows[0];
  expect(row).toEqual({rolsuper:false,rolcreatedb:false,rolcreaterole:false,rolreplication:false,rolbypassrls:false,rolcanlogin:true,rolconnlimit:r.connections});
  const groups=(await db.query<{rolname:string}>('SELECT p.rolname FROM pg_auth_members m JOIN pg_roles p ON p.oid=m.roleid JOIN pg_roles u ON u.oid=m.member WHERE u.rolname=$1',[r.login])).rows;expect(groups).toEqual([{rolname:r.group}]);
  expect((await db.query('SELECT c.relname FROM pg_class c JOIN pg_roles r ON r.oid=c.relowner WHERE r.rolname=$1',[r.login])).rows).toEqual([]);
 }
});
it('uninitialized installations fail the pre-DDL guard; a matching initialized installation permits inspection',async()=>{
 const reader={$queryRawUnsafe:async<T>(sql:string,...args:unknown[])=> (await db.query(sql,args)).rows as T};
 await expect(assertMigrationDestination(reader,setup.projectRef)).rejects.toThrow('uninitialized');
 await db.query('INSERT INTO "PlutoInstallation"(id,"projectRef") VALUES(true,$1)',[setup.projectRef]);
 await expect(assertMigrationDestination(reader,setup.projectRef)).resolves.toBeUndefined();
 await expect(assertMigrationDestination(reader,'anotherproject0000')).rejects.toThrow('mismatched');
});
