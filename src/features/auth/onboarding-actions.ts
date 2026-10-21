'use server';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {requireCustomer} from './server';
import {db} from '@/lib/db';
import {profileSchema,optionalModules} from '@/features/settings/profile-contract';
export async function completeOnboarding(form:FormData){
 const customer=await requireCustomer(),input=profileSchema.parse({displayName:form.get('displayName'),timezone:form.get('timezone'),currency:form.get('currency'),enabledModules:form.getAll('modules').length?form.getAll('modules'):[...optionalModules]}),plan=z.enum(['free','plus','pro']).parse(form.get('plan')??'free');
 await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub', ${customer.id}, true)`;
  await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',customer.id+':onboarding');
  const current=await tx.$queryRawUnsafe<{status:string}[]>('SELECT status FROM "User" WHERE id=$1::uuid FOR UPDATE',customer.id);
  if(current.length&&current[0].status!=='active')throw Error('Account is unavailable.');
  await tx.$executeRawUnsafe('INSERT INTO "User"(id,"displayName","updatedAt") VALUES($1::uuid,$2,now()) ON CONFLICT(id) DO UPDATE SET "displayName"=EXCLUDED."displayName","updatedAt"=now()',customer.id,input.displayName);
  await tx.$executeRawUnsafe('INSERT INTO "UserSettings"("userId",timezone,currency,"enabledModules","updatedAt") VALUES($1::uuid,$2,$3,$4::text[],now()) ON CONFLICT("userId") DO NOTHING',customer.id,input.timezone,input.currency,input.enabledModules);
  await tx.$executeRawUnsafe('UPDATE "User" SET "onboardingCompletedAt"=now() WHERE id=$1::uuid',customer.id);
  await tx.auditLog.create({data:{userId:customer.id,action:'customer.onboarding',outcome:'success'}});
 });redirect('/welcome?plan='+plan);
}
