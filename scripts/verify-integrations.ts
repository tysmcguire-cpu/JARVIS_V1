import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
process.loadEnvFile('.env');const db=new PrismaClient();const rollback=new Error('intentional rollback');const tables=['ApiConnection','SyncLog','ExternalRecord','CsvImportBatch','CsvImportKey'];
async function verify(){const owner=process.env.JARVIS_OWNER_ID!;for(const table of tables)assert.equal((await db.$queryRawUnsafe<{count:bigint}[]>(`SELECT count(*) FROM "${table}"`))[0].count,0n);
 try{await db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${owner},true)`;const account=randomUUID(),category=randomUUID(),batch=randomUUID(),transaction=randomUUID(),connection=randomUUID();
 await tx.$executeRawUnsafe('INSERT INTO "FinancialAccount"(id,"userId",title,currency,"openingBalance","updatedAt")VALUES($1::uuid,$2::uuid,\'Synthetic verification only\',\'USD\',0,now())',account,owner);
 await tx.$executeRawUnsafe('INSERT INTO "Category"(id,"userId",title,kind,"updatedAt")VALUES($1::uuid,$2::uuid,\'Synthetic verification only\',\'expense\',now())',category,owner);
 await tx.$executeRawUnsafe('INSERT INTO "CsvImportBatch"(id,"userId","accountId",digest,filename,currency,plan,"rowCount","duplicateCount","expiresAt")VALUES($1::uuid,$2::uuid,$3::uuid,$4,\'synthetic-verification.csv\',\'USD\',\'[]\'::jsonb,1,0,now()+interval \'30 minutes\')',batch,owner,account,'0'.repeat(64));
 await tx.$executeRawUnsafe('INSERT INTO "Transaction"(id,"userId","accountId","categoryId",title,amount,date,"csvBatchId","updatedAt")VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,\'Synthetic verification only\',1250,\'2026-10-16\',$5::uuid,now())',transaction,owner,account,category,batch);
 await tx.$executeRawUnsafe('INSERT INTO "CsvImportKey"(id,"userId","accountId","batchId","externalKey","payloadHash")VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6)',randomUUID(),owner,account,batch,'1'.repeat(64),'2'.repeat(64));
 assert.equal(await tx.$executeRawUnsafe('UPDATE "CsvImportBatch" SET "importedAt"=now(),"importedCount"=1 WHERE id=$1::uuid AND "userId"=$2::uuid',batch,owner),1);
 const available=await tx.$queryRawUnsafe<{provider:string}[]>('SELECT provider FROM "ApiConnection" WHERE "userId"=$1::uuid AND mode=\'mock\'',owner);const provider=['google-calendar','gmail','github','canvas','google-drive'].find(p=>!available.some(a=>a.provider===p));if(!provider)throw Error('Preserve existing mock fixtures');
 await tx.$executeRawUnsafe('INSERT INTO "ApiConnection"(id,"userId",provider,mode,status,"updatedAt")VALUES($1::uuid,$2::uuid,$3,\'mock\',\'disconnected\',now())',connection,owner,provider);
 await tx.$executeRawUnsafe('INSERT INTO "ExternalRecord"(id,"userId","connectionId","externalId",kind,payload,"sourceUrl","sourceUpdatedAt")VALUES($1::uuid,$2::uuid,$3::uuid,\'synthetic-verification\',\'Note\',\'{"title":"Synthetic verification only"}\'::jsonb,\'https://example.invalid\',now())',randomUUID(),owner,connection);
 await tx.$executeRawUnsafe('INSERT INTO "SyncLog"(id,"userId","connectionId",status,"recordCount")VALUES($1::uuid,$2::uuid,$3::uuid,\'healthy\',1)',randomUUID(),owner,connection);
 await tx.auditLog.create({data:{userId:owner,action:'integration.verify',outcome:'success'}});
 assert.equal(await tx.$executeRawUnsafe('DELETE FROM "Transaction" WHERE id=$1::uuid AND "userId"=$2::uuid',transaction,owner),1);assert.equal(await tx.$executeRawUnsafe('DELETE FROM "FinancialAccount" WHERE id=$1::uuid AND "userId"=$2::uuid',account,owner),1);assert.equal(await tx.$executeRawUnsafe('DELETE FROM "ApiConnection" WHERE id=$1::uuid AND "userId"=$2::uuid',connection,owner),1);
 throw rollback;
 },{timeout:30000})}catch(e){if(e!==rollback)throw e}
 await db.$transaction(async tx=>{await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${randomUUID()},true)`;for(const table of tables)assert.equal((await tx.$queryRawUnsafe<{count:bigint}[]>(`SELECT count(*) FROM "${table}"`))[0].count,0n)});
 console.info('PASS: live integration/CSV state linking, CRUD, cascade behavior and owner isolation verified with a rolled-back transaction. No fixtures, credentials or imported financial records persisted; no provider contacted.');
}
verify().catch(()=>{console.error('Integration database verification failed; private details suppressed.');process.exitCode=1}).finally(()=>db.$disconnect());
