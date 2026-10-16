import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { entities, moneyInput } from '../src/features/tracking/config';
import { syntheticRecords } from '../src/features/tracking/demo';
import { validateRecord } from '../src/features/tracking/validation';
process.loadEnvFile('.env');
const prisma = new PrismaClient({datasources:{db:{url:process.env.DIRECT_URL}}});
async function seed() {
 if(process.env.NODE_ENV==='production'||process.env.JARVIS_SEED_SYNTHETIC!=='true'||process.env.JARVIS_DATABASE_ENV!=='development')throw Error('Explicit development seed opt-in required');
 const ownerId=z.uuid().parse(process.env.JARVIS_OWNER_ID);const existing=await prisma.user.findUnique({where:{id:ownerId}});if(existing&&!existing.synthetic)throw Error('Existing real owner: seed refused');
 const fixtures=syntheticRecords();
 await prisma.$transaction(async tx=>{
 await tx.user.upsert({where:{id:ownerId},update:{},create:{id:ownerId,displayName:'Synthetic demonstration owner',synthetic:true,settings:{create:{}}}});
 for(const entity of entities){const record=fixtures[entity.key][0];const values=validateRecord(entity.key,Object.fromEntries(entity.fields.map(f=>[f.name,f.type==='money'?moneyInput(record[f.name]):record[f.name]])));const keys=Object.keys(values);const casts=entity.fields.map(f=>f.type==='relation'?'::uuid':f.type==='date'?'::date':'');await tx.$executeRawUnsafe(`INSERT INTO "${entity.key}" (${keys.map(k=>'"'+k+'"').join(',')},id,"userId","updatedAt") VALUES (${keys.map((_,i)=>'$'+(i+1)+casts[i]).join(',')},$${keys.length+1}::uuid,$${keys.length+2}::uuid,now()) ON CONFLICT(id) DO NOTHING`,...Object.values(values),record.id,ownerId);}
 },{timeout:60000});console.info('Clearly labeled synthetic tracking records seeded on an explicitly opted-in development owner.');
}
seed().catch(()=>{console.error('Seed refused or failed; check development flags, synthetic owner and migration setup. Private details suppressed.');process.exitCode=1}).finally(()=>prisma.$disconnect());
