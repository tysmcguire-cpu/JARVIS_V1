import {afterAll,afterEach,beforeAll,it,expect,vi} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const state=vi.hoisted(()=>({id:'',email:'',failAudit:false}));
let database:PGlite;
const alice=randomUUID(),bob=randomUUID(),uninvited=randomUUID();
vi.mock('server-only',()=>({}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('next/navigation',()=>({redirect:(to:string)=>{throw Error('redirect:'+to)}}));
vi.mock('@/features/auth/server',()=>({requireCustomer:async()=>({id:state.id,email:state.email})}));
vi.mock('@/lib/db',()=>({db:{$transaction:async(work:(tx:unknown)=>Promise<unknown>)=>database.transaction(async tx=>{
 await tx.exec('SET LOCAL ROLE pluto_app');
 return work({
  $queryRaw:async(strings:TemplateStringsArray,...args:unknown[])=>(await tx.query(strings.reduce((sql,part,i)=>sql+(i?'$'+i:'')+part,''),args)).rows,
  $queryRawUnsafe:async(sql:string,...args:unknown[])=>(await tx.query(sql,args)).rows,
  $executeRawUnsafe:async(sql:string,...args:unknown[])=>(await tx.query(sql,args)).affectedRows,
  auditLog:{create:async({data}:{data:{userId:string;action:string;outcome:string}})=>{
   if(state.failAudit)throw Error('Synthetic audit failure');
   return (await tx.query('INSERT INTO "AuditLog"(id,"userId",action,outcome)VALUES($1,$2,$3,$4)RETURNING id,"userId",action',[randomUUID(),data.userId,data.action,data.outcome])).rows[0];
  }}
 });
})}}));
import {completeOnboarding} from '@/features/auth/onboarding-actions';
import {loadProfile,saveProfile} from '@/features/settings/profile-actions';
import {withCustomerDatabase} from '@/lib/customer-db';
function form(name:string,timezone='America/Chicago',currency='USD'){
 const input=new FormData();input.set('displayName',name);input.set('timezone',timezone);input.set('currency',currency);input.append('modules','notes');input.append('modules','calendar');input.set('plan','free');
 // Browser-supplied identities must never select the workspace being created.
 input.set('userId',bob);input.set('id',bob);return input;
}
function actor(id:string,email:string){state.id=id;state.email=email}
beforeAll(async()=>{
 database=new PGlite();await database.exec(`CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
 for(const name of readdirSync('prisma/migrations').filter(n=>/^\d/.test(n)).sort())await database.exec(readFileSync(`prisma/migrations/${name}/migration.sql`,'utf8'));
 for(const id of [alice,bob,uninvited])await database.query('INSERT INTO auth.users VALUES($1)',[id]);
},30000);
afterEach(()=>{state.failAudit=false;vi.unstubAllEnvs()});
afterAll(async()=>database?.close());
function configure(){vi.stubEnv('PLUTO_STAGE','closed_beta');vi.stubEnv('PLUTO_BETA_EMAILS','alice@example.invalid,bob@example.invalid');vi.stubEnv('PLUTO_SUPABASE_PROJECT_REF','')}
it('rolls back the entire onboarding transaction when auditing fails, then permits a clean retry',async()=>{
 configure();actor(alice,'alice@example.invalid');state.failAudit=true;
 await expect(completeOnboarding(form('Alice synthetic'))).rejects.toThrow('Synthetic audit failure');
 for(const table of ['User','UserSettings','AuditLog'])expect((await database.query(`SELECT * FROM "${table}"`)).rows).toEqual([]);
 state.failAudit=false;await expect(completeOnboarding(form('Alice synthetic'))).rejects.toThrow('redirect:/welcome?plan=free');
 const rows=await database.query<{id:string;onboardingCompletedAt:Date}>('SELECT id,"onboardingCompletedAt" FROM "User"');expect(rows.rows).toHaveLength(1);expect(rows.rows[0].id).toBe(alice);expect(rows.rows[0].onboardingCompletedAt).not.toBeNull();
});
it('creates a second independent workspace and scopes profile, preferences and audit reads to the verified customer',async()=>{
 configure();actor(bob,'bob@example.invalid');await expect(completeOnboarding(form('Bob synthetic','Europe/London','GBP'))).rejects.toThrow('redirect:/welcome?plan=free');
 for(const [id,email,currency] of [[alice,'alice@example.invalid','USD'],[bob,'bob@example.invalid','GBP']]){
  actor(id,email);const view=await withCustomerDatabase(async(tx,user)=>({user,profiles:await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "User"'),settings:await tx.$queryRawUnsafe<{userId:string;currency:string;enabledModules:string[]}[]>('SELECT "userId",currency,"enabledModules" FROM "UserSettings"'),audits:await tx.$queryRawUnsafe<{userId:string}[]>('SELECT "userId" FROM "AuditLog"')}));
  expect(view.user).toBe(id);expect(view.profiles).toEqual([{id}]);expect(view.settings).toEqual([{userId:id,currency,enabledModules:['notes','calendar']}]);expect(view.audits).toEqual([{userId:id}]);
 }
});
it('allows repeat onboarding after invitation removal without duplicating profiles or overwriting saved preferences',async()=>{
 configure();vi.stubEnv('PLUTO_BETA_EMAILS','');actor(alice,'alice@example.invalid');
 await expect(completeOnboarding(form('Alice renamed','UTC','EUR'))).rejects.toThrow('redirect:/welcome?plan=free');
 expect((await database.query('SELECT id FROM "User"')).rows).toHaveLength(2);
 const settings=await database.query('SELECT timezone,currency FROM "UserSettings" WHERE "userId"=$1',[alice]);expect(settings.rows).toEqual([{timezone:'America/Chicago',currency:'USD'}]);
 expect((await database.query('SELECT "displayName" FROM "User" WHERE id=$1',[bob])).rows).toEqual([{displayName:'Bob synthetic'}]);
});
it('rejects uninvited enrollment and prevents suspended customers from completing onboarding or reading data',async()=>{
 configure();actor(uninvited,'uninvited@example.invalid');await expect(completeOnboarding(form('Uninvited'))).rejects.toThrow('enrollment');
 expect((await database.query('SELECT id FROM "User" WHERE id=$1',[uninvited])).rows).toEqual([]);
 await database.query('UPDATE "User" SET status=\'suspended\' WHERE id=$1',[alice]);actor(alice,'alice@example.invalid');
 await expect(completeOnboarding(form('Reactivation attempt'))).rejects.toThrow('unavailable');await expect(withCustomerDatabase(async()=>true)).rejects.toThrow('unavailable');
 expect((await database.query('SELECT status FROM "User" WHERE id=$1',[alice])).rows).toEqual([{status:'suspended'}]);
 actor(bob,'bob@example.invalid');expect(await withCustomerDatabase(async(_tx,id)=>id)).toBe(bob);
});

it('persists customer profile/module choices and rejects stale updates without partial changes',async()=>{
 configure();actor(bob,'bob@example.invalid');const original=await loadProfile();
 const changed=await saveProfile({displayName:'Bob updated',timezone:'Asia/Tokyo',currency:'CAD',enabledModules:['notes','goals']},original.updatedAt);
 expect(changed).toMatchObject({displayName:'Bob updated',timezone:'Asia/Tokyo',currency:'CAD',enabledModules:['notes','goals']});expect(changed.updatedAt).not.toBe(original.updatedAt);
 await expect(saveProfile({displayName:'Stale overwrite',timezone:'UTC',currency:'USD',enabledModules:['finances']},original.updatedAt)).rejects.toThrow('Profile changed');
 expect(await loadProfile()).toEqual(changed);expect((await database.query('SELECT "displayName" FROM "User" WHERE id=$1',[alice])).rows).toEqual([{displayName:'Alice renamed'}]);
});
it('rolls back profile and settings together if the audit write fails',async()=>{
 configure();actor(bob,'bob@example.invalid');const original=await loadProfile();state.failAudit=true;
 await expect(saveProfile({displayName:'Must roll back',timezone:'UTC',currency:'EUR',enabledModules:['calendar']},original.updatedAt)).rejects.toThrow('Synthetic audit failure');
 state.failAudit=false;expect(await loadProfile()).toEqual(original);
});
