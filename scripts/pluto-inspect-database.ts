import {PrismaClient} from '@prisma/client';
import {argument,setup,setupEnvironment,assertSetupTarget,assertMigrationDestination} from './pluto-setup-lib';
async function main(){
 const env=setupEnvironment(argument('env'));assertSetupTarget(env);
 if(!process.argv.includes('--connect')){console.info(`OFFLINE PLAN ONLY: inspect ${setup.projectRef} using a READ ONLY transaction. No connection made. Use --connect only after saving this project's administrative URI privately.`);return}
 if(!env.DIRECT_URL)throw Error('Migration-only administrator connection is missing.');
 const db=new PrismaClient({datasourceUrl:env.DIRECT_URL});
 try{await db.$transaction(async tx=>{
  await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
  await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '8s'");
  const [prerequisites]=await tx.$queryRawUnsafe<{authReady:boolean}[]>('SELECT to_regclass(\'auth.users\') IS NOT NULL AND to_regprocedure(\'auth.uid()\') IS NOT NULL AS "authReady"');
  if(!prerequisites.authReady)throw Error('Expected Supabase Auth prerequisites are missing.');
  await assertMigrationDestination(tx,setup.projectRef);
 });console.info(JSON.stringify({projectRef:setup.projectRef,connected:true,readOnly:true,authPrerequisitesPresent:true,destinationGuardPassed:true,migrationsRun:false,rolesCreated:false},null,2));}
 finally{await db.$disconnect()}
}
main().catch(()=>{console.error('Read-only database inspection failed. Check the commercial URI/password, TLS, session/direct port 5432, network, Auth prerequisites and destination guard. No migration or provisioning was attempted. Private details suppressed.');process.exitCode=1});
