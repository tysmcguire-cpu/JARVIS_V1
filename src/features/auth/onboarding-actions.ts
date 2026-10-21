'use server';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {requireCustomer} from './server';
import {db} from '@/lib/db';
const profile=z.object({displayName:z.string().trim().min(1).max(100),timezone:z.string().max(100).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true}catch{return false}}),currency:z.enum(['USD','EUR','GBP','CAD','AUD'])});
export async function completeOnboarding(form:FormData){
 const customer=await requireCustomer(),input=profile.parse(Object.fromEntries(form));
 await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub', ${customer.id}, true)`;
  await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',customer.id+':onboarding');
  const current=await tx.$queryRawUnsafe<{status:string}[]>('SELECT status FROM "User" WHERE id=$1::uuid',customer.id);
  if(current.length&&current[0].status!=='active')throw Error('Account is unavailable.');
  await tx.$executeRawUnsafe('INSERT INTO "User"(id,"displayName","updatedAt") VALUES($1::uuid,$2,now()) ON CONFLICT(id) DO UPDATE SET "displayName"=EXCLUDED."displayName","updatedAt"=now()',customer.id,input.displayName);
  await tx.$executeRawUnsafe('INSERT INTO "UserSettings"("userId",timezone,currency,"updatedAt") VALUES($1::uuid,$2,$3,now()) ON CONFLICT("userId") DO NOTHING',customer.id,input.timezone,input.currency);
  await tx.$executeRawUnsafe('UPDATE "User" SET "onboardingCompletedAt"=now() WHERE id=$1::uuid',customer.id);
  await tx.auditLog.create({data:{userId:customer.id,action:'customer.onboarding',outcome:'success'}});
 });redirect('/');
}
