import {it,expect,vi,afterEach} from 'vitest';
import {assertSetupTarget,assertMigrationDestination,roleSql,runtimeRoles,setup,migrationInventory,assertReviewedMigrations} from '../../scripts/pluto-setup-lib';
afterEach(()=>vi.unstubAllEnvs());
it('pins setup to the reviewed commercial project and never accepts a personal or mismatched target',()=>{
 const e={PLUTO_SUPABASE_PROJECT_REF:setup.projectRef,NEXT_PUBLIC_SUPABASE_URL:`https://${setup.projectRef}.supabase.co`};
 expect(()=>assertSetupTarget(e)).not.toThrow();expect(()=>assertSetupTarget({...e,PLUTO_SUPABASE_PROJECT_REF:'anotherproject0000'})).toThrow('reference');expect(()=>assertSetupTarget({...e,JARVIS_OWNER_ID:'personal'})).toThrow('Personal');expect(()=>assertSetupTarget({...e,NEXT_PUBLIC_SUPABASE_URL:'https://personal.supabase.co'})).toThrow('Auth URL');
 expect(()=>assertSetupTarget({...e,DATABASE_URL:`postgresql://postgres:synthetic@db.${setup.projectRef}.supabase.co/postgres?sslmode=require`})).toThrow('restricted');
 expect(()=>assertSetupTarget({...e,DIRECT_URL:`postgresql://postgres.${setup.projectRef}:synthetic@aws-0-test.pooler.supabase.com:6543/postgres?sslmode=require`})).toThrow('5432');
 expect(()=>assertSetupTarget({...e,PLUTO_BILLING_DATABASE_URL:`postgresql://pluto_runtime:synthetic@db.${setup.projectRef}.supabase.co/postgres?sslmode=require`})).toThrow('intended restricted');
});
it('refuses unmarked populated destinations before migrations and validates existing installation identity',async()=>{
 const make=(tables:string[],ref?:string)=>({$queryRawUnsafe:vi.fn().mockResolvedValueOnce(tables.map(name=>({name}))).mockResolvedValueOnce(ref?[{projectRef:ref}]:[])});
 await expect(assertMigrationDestination(make([]),setup.projectRef)).resolves.toBeUndefined();
 for(const name of ['User','unrelated_table','_prisma_migrations'])await expect(assertMigrationDestination(make([name]),setup.projectRef)).rejects.toThrow('not empty');
 await expect(assertMigrationDestination(make(['PlutoInstallation'],'other'),setup.projectRef)).rejects.toThrow('mismatched');
 await expect(assertMigrationDestination(make(['PlutoInstallation']),setup.projectRef)).rejects.toThrow('uninitialized');
 await expect(assertMigrationDestination(make(['PlutoInstallation'],setup.projectRef),setup.projectRef)).resolves.toBeUndefined();
});
it('plans fixed restricted logins only, with one group and bounded connections, without credential rotation',()=>{
 for(const key of Object.keys(runtimeRoles) as (keyof typeof runtimeRoles)[]){const sql=roleSql(key);expect(sql).toContain('NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS');expect(sql).toContain('SET_A_NEW_PRIVATE_PASSWORD');expect(sql.match(/GRANT /g)).toHaveLength(1);expect(sql).not.toMatch(/ALTER ROLE .* PASSWORD|BYPASSRLS true|WITH ADMIN OPTION/);}
 expect(roleSql('app',"synthetic'quote")).toContain("synthetic''quote");
 expect(()=>roleSql('unknown' as 'app')).toThrow('Unknown');
});
it('has a stable complete reviewed inventory without mutating historical migrations',()=>{expect(migrationInventory()).toHaveLength(26);expect(()=>assertReviewedMigrations()).not.toThrow();expect(migrationInventory().every(m=>/^[a-f0-9]{64}$/.test(m.sha256))).toBe(true)});
