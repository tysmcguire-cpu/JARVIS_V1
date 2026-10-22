import {assertCommercialDatabase} from '../src/features/commercial/isolation';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {loadEnvironment} from './load-environment';
import {PrismaClient} from '@prisma/client';
import {setup,assertSetupTarget,assertReviewedMigrations,assertMigrationDestination} from './pluto-setup-lib';
loadEnvironment();
assertSetupTarget(process.env);
assertReviewedMigrations();
if(process.env.DIRECT_URL)assertCommercialDatabase(process.env.DIRECT_URL,process.env.PLUTO_SUPABASE_PROJECT_REF,true);
if(process.env.PLUTO_ALLOW_MIGRATIONS!=='approved'||!process.env.DIRECT_URL||!process.env.PLUTO_SUPABASE_PROJECT_REF)throw Error('Commercial migrations require an explicitly approved, separate Pluto project.');
// Read-only destination inspection MUST finish before Prisma can execute any DDL.
const inspection=new PrismaClient({datasourceUrl:process.env.DIRECT_URL});
try{await inspection.$transaction(tx=>assertMigrationDestination(tx,setup.projectRef),{timeout:15000})}catch{console.error('Pre-migration destination check failed. No migration was started. Private details suppressed.');process.exitCode=1;await inspection.$disconnect();process.exit(1)}
await inspection.$disconnect();
const require=createRequire(import.meta.url),result=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','deploy'],{stdio:'pipe',env:{...process.env,DATABASE_URL:process.env.DIRECT_URL}});
process.exitCode=result.status??1;
console.info(result.status===0?'Reviewed commercial migrations applied.':'Migration process failed. Inspect private migration diagnostics; raw output suppressed to protect connection details.');
if(result.status===0){const db=new PrismaClient({datasourceUrl:process.env.DIRECT_URL});try{await db.$transaction(async tx=>{const [existing]=await tx.$queryRawUnsafe<{projectRef:string}[]>('SELECT "projectRef" FROM "PlutoInstallation" WHERE id=true FOR UPDATE');if(existing&&existing.projectRef!==process.env.PLUTO_SUPABASE_PROJECT_REF)throw Error('Installation identity differs; approve a separate restore/rebind procedure.');await tx.$executeRawUnsafe('INSERT INTO "PlutoInstallation"(id,"projectRef")VALUES(true,$1)ON CONFLICT(id)DO NOTHING',process.env.PLUTO_SUPABASE_PROJECT_REF!)})}catch{console.error('Commercial installation identity could not be initialized. Private details suppressed.');process.exitCode=1}finally{await db.$disconnect()}}
