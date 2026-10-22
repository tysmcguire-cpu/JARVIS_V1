import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseEnv} from 'node:util';
import {assertCommercialDatabase} from '../src/features/commercial/isolation';

export const setup=JSON.parse(readFileSync('pluto.setup.json','utf8')) as {projectRef:string;branch:string};
export function setupEnvironment(path?:string){return path?parseEnv(readFileSync(path,'utf8')):process.env}
export function argument(name:string){return process.argv.find(v=>v.startsWith('--'+name+'='))?.slice(name.length+3)}
export function assertSetupTarget(env:Record<string,string|undefined>){
 if(env.JARVIS_OWNER_ID)throw Error('Personal environment is prohibited.');
 if(env.PLUTO_SUPABASE_PROJECT_REF!==setup.projectRef)throw Error('Project reference differs from reviewed Pluto installation.');
 if(env.NEXT_PUBLIC_SUPABASE_URL&&env.NEXT_PUBLIC_SUPABASE_URL!==`https://${setup.projectRef}.supabase.co`)throw Error('Auth URL differs from reviewed installation.');
 for(const key of ['DATABASE_URL','DIRECT_URL'])if(env[key])assertCommercialDatabase(env[key]!,setup.projectRef,key==='DIRECT_URL');
 for(const role of Object.values(runtimeRoles)){if(!env[role.variable])continue;const url=env[role.variable]!;assertCommercialDatabase(url,setup.projectRef,true);const name=decodeURIComponent(new URL(url).username);if(name!==role.login&&name!==role.login+'.'+setup.projectRef)throw Error('Database URL does not use its intended restricted login.');}
 if(env.DIRECT_URL&&new URL(env.DIRECT_URL).port==='6543')throw Error('Use direct or session-mode port 5432 for administrative migrations, never transaction-mode 6543.');
}
export function migrationInventory(){return readdirSync('prisma/migrations').filter(n=>/^\d/.test(n)).sort().map(name=>{const sql=readFileSync(`prisma/migrations/${name}/migration.sql`,'utf8').replace(/\r\n/g,'\n');return {name,sha256:createHash('sha256').update(sql).digest('hex'),bytes:Buffer.byteLength(sql)}})}
export function assertReviewedMigrations(){const reviewed=JSON.parse(readFileSync('deployment/pluto-migrations.reviewed.json','utf8'));if(JSON.stringify(reviewed)!==JSON.stringify(migrationInventory()))throw Error('Migration files differ from reviewed inventory; review and regenerate the manifest first.');}

export const runtimeRoles={
 app:{login:'pluto_runtime',group:'pluto_app',variable:'DATABASE_URL',connections:3},
 worker:{login:'pluto_worker_runtime',group:'pluto_worker',variable:'PLUTO_WORKER_DATABASE_URL',connections:2},
 billing:{login:'pluto_billing_runtime',group:'pluto_billing',variable:'PLUTO_BILLING_DATABASE_URL',connections:2},
 erasure:{login:'pluto_erasure_runtime',group:'pluto_erasure',variable:'PLUTO_ERASURE_DATABASE_URL',connections:2},
 admin:{login:'pluto_admin_runtime',group:'pluto_admin',variable:'PLUTO_ADMIN_DATABASE_URL',connections:2},
 adminApi:{login:'pluto_admin_api_runtime',group:'pluto_admin_api',variable:'PLUTO_ADMIN_API_DATABASE_URL',connections:2},
} as const;
export type RuntimeRole=keyof typeof runtimeRoles;
export function roleSql(key:RuntimeRole,password?:string){const role=runtimeRoles[key];if(!role)throw Error('Unknown runtime role');const secret=(password??'SET_A_NEW_PRIVATE_PASSWORD').replaceAll("'","''");return `CREATE ROLE ${role.login} LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT ${role.connections} PASSWORD '${secret}';\nGRANT ${role.group} TO ${role.login};\nALTER ROLE ${role.login} SET search_path = pg_catalog, public;\nALTER ROLE ${role.login} SET statement_timeout = '25s';\nALTER ROLE ${role.login} SET idle_in_transaction_session_timeout = '30s';`}

type Reader={$queryRawUnsafe:<T=unknown>(sql:string,...args:unknown[])=>Promise<T>};
export async function assertMigrationDestination(tx:Reader,expected:string){
 const tables=await tx.$queryRawUnsafe<{name:string}[]>("SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')");
 if(tables.some(t=>t.name==='PlutoInstallation')){
  const rows=await tx.$queryRawUnsafe<{projectRef:string}[]>('SELECT "projectRef" FROM public."PlutoInstallation" WHERE id=true');
  if(rows.length!==1||rows[0].projectRef!==expected)throw Error('Existing database installation is uninitialized or mismatched; explicit recovery review required.');
 }else{
  if(tables.length)throw Error('Unmarked database is not empty; migrations refused before DDL.');
  const roles=await tx.$queryRawUnsafe<{rolname:string}[]>("SELECT rolname FROM pg_roles WHERE left(rolname,6)='pluto_'");
  if(roles.length)throw Error('Unmarked database already contains Pluto roles; review existing privileges before migration.');
 }
}
