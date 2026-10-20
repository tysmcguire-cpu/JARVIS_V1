import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
import {z} from 'zod';
process.loadEnvFile('.env');
const owner=z.uuid().parse(process.env.JARVIS_OWNER_ID),db=new PrismaClient();
const rollback=Error('verification rollback');
async function verify(){try{
 await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${owner},true)`;
  const user=await tx.user.findUniqueOrThrow({where:{id:owner}});
  assert.equal(user.id,owner);assert.equal(user.synthetic,false);
  const settings=await tx.userSettings.findUniqueOrThrow({where:{userId:owner}});
  assert.ok(['12h','24h'].includes(settings.clockFormat));
  for(const clockFormat of ['12h','24h']){
   await tx.userSettings.update({where:{userId:owner},data:{clockFormat}});
   assert.equal((await tx.userSettings.findUniqueOrThrow({where:{userId:owner}})).clockFormat,clockFormat);
  }
  await tx.auditLog.create({data:{userId:owner,action:'settings.appearance.update',outcome:'success'}});
  throw rollback;
 });
}catch(error){
 if(error!==rollback){console.error('FAIL: clock format runtime verification. No credential values printed.');process.exitCode=1;}
 else console.info('PASS: owner-scoped clock format read/update/audit verified; all verification writes rolled back.');
}finally{await db.$disconnect()}}
void verify();
