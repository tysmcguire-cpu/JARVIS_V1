import {PrismaClient} from '@prisma/client';
import {randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute,dirname,join} from 'node:path';
import {existsSync} from 'node:fs';
import {argument,setup,setupEnvironment,assertSetupTarget,assertReviewedMigrations,runtimeRoles,roleSql,type RuntimeRole} from './pluto-setup-lib';
async function main(){
 const key=(argument('role')??'app') as RuntimeRole;if(!Object.hasOwn(runtimeRoles,key))throw Error('Choose app, worker, billing, erasure, admin or adminApi.');
 const env=setupEnvironment(argument('env'));assertSetupTarget(env);assertReviewedMigrations();
 if(!process.argv.includes('--apply')){console.info(`OFFLINE PLAN ONLY. Target ${setup.projectRef}. No connection will be made.\n${roleSql(key)}`);return}
 if(env.PLUTO_ALLOW_ROLE_PROVISIONING!=='approved'||!env.DIRECT_URL)throw Error('Separate explicit role-provisioning approval and administrative URL required.');
 const output=argument('credentials-file');if(!output)throw Error('Choose a private credentials-file outside the Git checkout.');
 const path=resolve(output),local=relative(process.cwd(),path);if(!local.startsWith('..')&&!isAbsolute(local))throw Error('Credential output must be outside the repository.');
 for(let folder=dirname(path);;folder=dirname(folder)){if(existsSync(join(folder,'.git')))throw Error('Credential output must be outside every Git checkout.');if(dirname(folder)===folder)break}
 const role=runtimeRoles[key],password=randomBytes(32).toString('base64url'),db=new PrismaClient({datasourceUrl:env.DIRECT_URL});
 try{await db.$transaction(async tx=>{
  await tx.$queryRawUnsafe('SELECT public.pluto_assert_installation($1)',setup.projectRef);
  const groups=await tx.$queryRawUnsafe<{rolsuper:boolean;rolbypassrls:boolean;rolcanlogin:boolean;rolcreaterole:boolean;rolcreatedb:boolean;rolreplication:boolean}[]>('SELECT rolsuper,rolbypassrls,rolcanlogin,rolcreaterole,rolcreatedb,rolreplication FROM pg_roles WHERE rolname=$1',role.group);
  if(groups.length!==1||Object.values(groups[0]).some(Boolean))throw Error('Restricted NOLOGIN group is missing or unsafe.');
  const parents=await tx.$queryRawUnsafe<{rolname:string}[]>('WITH RECURSIVE inherited(oid) AS(SELECT roleid FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname=$1) UNION SELECT m.roleid FROM pg_auth_members m JOIN inherited i ON m.member=i.oid)SELECT r.rolname FROM inherited i JOIN pg_roles r ON r.oid=i.oid',role.group);
  if(parents.some(p=>role.group!=='pluto_worker'||p.rolname!=='pluto_app'))throw Error('Unexpected inherited role privilege; provisioning refused.');
  const owners=await tx.$queryRawUnsafe<{unsafe:boolean}[]>('SELECT EXISTS(SELECT 1 FROM pg_class c JOIN pg_roles r ON r.oid=c.relowner WHERE r.rolname=ANY($1::text[])) OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_roles r ON r.oid=p.proowner WHERE r.rolname=ANY($1::text[])) AS unsafe',[role.group,...parents.map(p=>p.rolname)]);if(owners[0].unsafe)throw Error('Restricted groups must not own database objects.');
  const existing=await tx.$queryRawUnsafe<{rolname:string}[]>('SELECT rolname FROM pg_roles WHERE rolname=$1',role.login);if(existing.length)throw Error('Runtime login already exists. Refusing to alter existing credentials or privileges.');
  // Fixed identifiers and generated password only; no caller SQL.
  for(const sql of roleSql(key,password).split(';').map(s=>s.trim()).filter(Boolean))await tx.$executeRawUnsafe(sql);
  const [privilege]=await tx.$queryRawUnsafe<{allowed:boolean}[]>('SELECT has_schema_privilege($1,\'public\',\'CREATE\') AS allowed',role.login);if(privilege.allowed)throw Error('Runtime must not have public schema CREATE privileges.');
  const url=new URL(env.DIRECT_URL!);url.username=url.hostname.endsWith('.pooler.supabase.com')?role.login+'.'+setup.projectRef:role.login;url.password=password;url.searchParams.set('connection_limit',String(role.connections));url.searchParams.set('pool_timeout','10');
  await writeFile(path,role.variable+'='+url.toString()+'\n',{flag:'wx',mode:0o600});
 },{timeout:15000});console.info('One restricted role created. Connection URL saved privately; no credentials printed. Keep optional features disabled.');}
 // Preserve an output file after an uncertain commit acknowledgement. Never
 // destroy the only copy of a password or silently rotate an existing login.
 finally{await db.$disconnect()}
}
main().catch(()=>{console.error('Role setup did not complete. Check explicit approval, reviewed target, installation marker, existing role and private output path. Private details suppressed.');process.exitCode=1});
