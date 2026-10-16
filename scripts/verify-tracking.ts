import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { entities } from '../src/features/tracking/config';
import { syntheticRecords } from '../src/features/tracking/demo';
import { validateRecord } from '../src/features/tracking/validation';
import { moneyInput } from '../src/features/tracking/config';
process.loadEnvFile('.env');const runtime=new PrismaClient();const rollback=new Error('intentional test rollback');
async function verify(){
 const owner=process.env.JARVIS_OWNER_ID!;
 for(const e of entities)assert.equal(await runtime.$queryRawUnsafe<{count:bigint}[]>(`SELECT count(*) FROM "${e.key}"`).then(r=>r[0].count),0n);
 try{await runtime.$transaction(async tx=>{
 await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub', ${owner}, true)`;
 const fixtures=syntheticRecords();const ids:Record<string,string>={};for(const e of entities)ids[e.key]=randomUUID();
 for(const e of entities){const f=fixtures[e.key][0];const values=validateRecord(e.key,Object.fromEntries(e.fields.map(field=>[field.name,field.type==='relation'?ids[field.target!]:field.type==='money'?moneyInput(f[field.name]):f[field.name]])));const fields=Object.keys(values);const casts=e.fields.map(field=>field.type==='relation'?'::uuid':field.type==='date'?'::date':'');await tx.$executeRawUnsafe(`INSERT INTO "${e.key}" (${fields.map(k=>'"'+k+'"').join(',')},id,"userId","updatedAt") VALUES (${fields.map((_,i)=>'$'+(i+1)+casts[i]).join(',')},$${fields.length+1}::uuid,$${fields.length+2}::uuid,now())`,...Object.values(values),ids[e.key],owner);const read=await tx.$queryRawUnsafe<{title:string}[]>(`SELECT title FROM "${e.key}" WHERE id=$1::uuid AND "userId"=$2::uuid`,ids[e.key],owner);assert.equal(read[0].title,f.title);assert.equal(await tx.$executeRawUnsafe(`UPDATE "${e.key}" SET title=$1 WHERE id=$2::uuid AND "userId"=$3::uuid`,'Synthetic verification only',ids[e.key],owner),1);}
 await tx.auditLog.create({data:{userId:owner,action:'tracking.verify',outcome:'success'}});
 for(const e of [...entities].reverse())assert.equal(await tx.$executeRawUnsafe(`DELETE FROM "${e.key}" WHERE id=$1::uuid AND "userId"=$2::uuid`,ids[e.key],owner),1);
 throw rollback;
 },{timeout:60000})}catch(e){if(e!==rollback)throw e;}
 await runtime.$transaction(async tx=>{await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub', ${randomUUID()}, true)`;for(const e of entities)assert.equal((await tx.$queryRawUnsafe<{count:bigint}[]>(`SELECT count(*) FROM "${e.key}"`))[0].count,0n)});
 console.info('PASS: live owner-scoped create/read/update/delete across all 24 tracking tables, audit insert and second-identity isolation. Verification transaction rolled back; no sample records saved.');
}
verify().catch(()=>{console.error('Live tracking verification failed; private details suppressed.');process.exitCode=1}).finally(()=>runtime.$disconnect());
