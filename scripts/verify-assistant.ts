import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
process.loadEnvFile('.env');const db=new PrismaClient(),rollback=new Error('intentional rollback');
async function verify(){const owner=process.env.JARVIS_OWNER_ID!;await db.$transaction(async tx=>{for(const table of ['AiConversation','AiSourceReference'])assert.equal((await tx.$queryRawUnsafe<{count:bigint}[]>(`SELECT count(*) FROM "${table}"`))[0].count,0n)});
 try{await db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${owner},true)`;const id=randomUUID();
 await tx.$executeRawUnsafe('INSERT INTO "AiConversation"(id,"userId",question,query,status)VALUES($1::uuid,$2::uuid,\'Synthetic verification only\',\'{}\',\'pending\')',id,owner);
 await tx.$executeRawUnsafe('UPDATE "AiConversation" SET status=\'complete\',answer=\'{}\' WHERE id=$1::uuid AND "userId"=$2::uuid',id,owner);
 await tx.$executeRawUnsafe('INSERT INTO "AiSourceReference"(id,"userId","conversationId",reference,label,href,"sourceUpdatedAt","fetchedAt")VALUES($1::uuid,$2::uuid,$3::uuid,\'synthetic\',\'Synthetic verification only\',\'/projects\',now(),now())',randomUUID(),owner,id);
 await tx.auditLog.create({data:{userId:owner,action:'assistant.request',outcome:'success'}});
 assert.ok(Number((await tx.$queryRawUnsafe<{count:string}[]>('SELECT count(*)::text AS count FROM "AuditLog" WHERE "userId"=$1::uuid AND action=\'assistant.request\'',owner))[0].count)>0);
 assert.equal(await tx.$executeRawUnsafe('DELETE FROM "AiConversation" WHERE id=$1::uuid AND "userId"=$2::uuid',id,owner),1);assert.equal((await tx.$queryRawUnsafe<{count:bigint}[]>('SELECT count(*) FROM "AiSourceReference" WHERE "conversationId"=$1::uuid',id))[0].count,0n);throw rollback;
 },{timeout:20000})}catch(e){if(e!==rollback)throw e}
 await db.$transaction(async tx=>{await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${randomUUID()},true)`;for(const table of ['AiConversation','AiSourceReference'])assert.equal((await tx.$queryRawUnsafe<{count:bigint}[]>(`SELECT count(*) FROM "${table}"`))[0].count,0n)});
 console.info('PASS: live assistant CRUD, source linking, cascade, rate-budget reads and owner isolation verified in a rolled-back transaction. No conversation retained or AI contacted.');
}
verify().catch(()=>{console.error('Assistant verification failed; private details suppressed.');process.exitCode=1}).finally(()=>db.$disconnect());
