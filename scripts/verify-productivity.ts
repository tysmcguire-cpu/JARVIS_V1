import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
process.loadEnvFile('.env');
const database=new PrismaClient(),rollback=new Error('intentional rollback');
async function verify(){const owner=process.env.JARVIS_OWNER_ID!;assert.ok(owner);
 try{await database.$transaction(async tx=>{
  await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${owner},true)`;
  const note=randomUUID(),state=randomUUID(),a=randomUUID(),b=randomUUID(),income=randomUUID(),expense=randomUUID(),group=randomUUID();
  await tx.$executeRawUnsafe('INSERT INTO "Note" (id,"userId",title,content,tag,"updatedAt") VALUES($1::uuid,$2::uuid,\'Synthetic verification\',\'Rollback only\',\'verification\',now())',note,owner);
  assert.equal(await tx.$executeRawUnsafe('UPDATE "Note" SET content=repeat(\'x\',32000) WHERE id=$1::uuid AND "userId"=$2::uuid',note,owner),1);
  await tx.$executeRawUnsafe('INSERT INTO "WorkspaceState" (id,"userId",key,value,version,"updatedAt") VALUES($1::uuid,$2::uuid,$3,\'{"layout":"default","core":true,"widgets":[]}\'::jsonb,1,now())',state,owner,'verification:'+state);
  assert.equal(await tx.$executeRawUnsafe('UPDATE "WorkspaceState" SET version=version+1 WHERE id=$1::uuid AND "userId"=$2::uuid',state,owner),1);
  await tx.$executeRawUnsafe('INSERT INTO "FinancialAccount" (id,"userId",title,currency,"openingBalance","updatedAt") VALUES($1::uuid,$3::uuid,\'Synthetic A\',\'USD\',1000,now()),($2::uuid,$3::uuid,\'Synthetic B\',\'USD\',0,now())',a,b,owner);
  await tx.$executeRawUnsafe('INSERT INTO "Category" (id,"userId",title,kind,"updatedAt") VALUES($1::uuid,$3::uuid,$4,\'income\',now()),($2::uuid,$3::uuid,$5,\'expense\',now())',income,expense,owner,'Synthetic income '+group,'Synthetic expense '+group);
  await tx.$executeRawUnsafe('INSERT INTO "Transaction" (id,"userId",title,"accountId","categoryId",amount,date,"transferGroup","updatedAt") VALUES($1::uuid,$3::uuid,\'Synthetic transfer\',$4::uuid,$6::uuid,123,CURRENT_DATE,$8::uuid,now()),($2::uuid,$3::uuid,\'Synthetic transfer\',$5::uuid,$7::uuid,123,CURRENT_DATE,$8::uuid,now())',randomUUID(),randomUUID(),owner,a,b,expense,income,group);
  await tx.$executeRawUnsafe('SET CONSTRAINTS ledger_transfer_pair IMMEDIATE');
  const [{total}]=await tx.$queryRawUnsafe<{total:number}[]>('SELECT count(*)::int AS total FROM "Transaction" WHERE "userId"=$1::uuid AND "transferGroup"=$2::uuid',owner,group);assert.equal(total,2);
  await tx.$executeRawUnsafe('DELETE FROM "Transaction" WHERE "userId"=$1::uuid AND "transferGroup"=$2::uuid',owner,group);
  await tx.$executeRawUnsafe('DELETE FROM "WorkspaceState" WHERE id=$1::uuid AND "userId"=$2::uuid',state,owner);
  await tx.auditLog.create({data:{userId:owner,action:'tracking.productivity.verify',outcome:'success'}});throw rollback;
 },{timeout:25000})}catch(error){if(error!==rollback)throw error}
 await database.$transaction(async tx=>{await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${randomUUID()},true)`;const [{total}]=await tx.$queryRawUnsafe<{total:number}[]>('SELECT count(*)::int AS total FROM "WorkspaceState"');assert.equal(total,0)});
 const [{exposed}]=await database.$queryRawUnsafe<{exposed:boolean}[]>('SELECT bool_or(has_table_privilege(r.name,\'public."WorkspaceState"\',\'SELECT,INSERT,UPDATE,DELETE\')) AS exposed FROM unnest(ARRAY[\'anon\',\'authenticated\']) r(name)');assert.equal(exposed,false);
 console.info('PASS: runtime state CRUD, ledger locks/paired transfers, audit permissions, independent RLS and browser-role denial. All synthetic writes rolled back. No owner preference or saved record changed.');
}
verify().catch(()=>{console.error('Productivity database verification failed; private details suppressed.');process.exitCode=1}).finally(()=>database.$disconnect());
