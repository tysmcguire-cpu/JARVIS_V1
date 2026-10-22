'use server';
import {registrationEmailAllowed} from '@/features/commercial/rollout';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {requireCustomer} from './server';
import {assertInstallation} from '@/features/commercial/installation';
import {db} from '@/lib/db';
import {profileSchema,optionalModules} from '@/features/settings/profile-contract';

export type OnboardingState={message:string};
async function createWorkspace(customer:{id:string;email?:string},form:FormData){
 const input=profileSchema.parse({displayName:form.get('displayName'),timezone:form.get('timezone'),currency:form.get('currency'),enabledModules:form.getAll('modules').length?form.getAll('modules'):[...optionalModules]}),plan=z.enum(['free','plus','pro']).parse(form.get('plan')??'free');
 await db.$transaction(async tx=>{await assertInstallation(tx);
  await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub', ${customer.id}, true)`;
  await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',customer.id+':onboarding');
  const current=await tx.$queryRawUnsafe<{status:string}[]>('SELECT status FROM "User" WHERE id=$1::uuid FOR UPDATE',customer.id);
  if(!current.length&&!registrationEmailAllowed(customer.email??''))throw Error('Workspace enrollment is not enabled for this account.');
  if(current.length&&current[0].status!=='active')throw Error('Account is unavailable.');
  await tx.$executeRawUnsafe('INSERT INTO "User"(id,"displayName","updatedAt") VALUES($1::uuid,$2,now()) ON CONFLICT(id) DO UPDATE SET "displayName"=EXCLUDED."displayName","updatedAt"=now()',customer.id,input.displayName);
  await tx.$executeRawUnsafe('INSERT INTO "UserSettings"("userId",timezone,currency,"enabledModules","updatedAt") VALUES($1::uuid,$2,$3,$4::text[],now()) ON CONFLICT("userId") DO NOTHING',customer.id,input.timezone,input.currency,input.enabledModules);
  await tx.$executeRawUnsafe('UPDATE "User" SET "onboardingCompletedAt"=now() WHERE id=$1::uuid',customer.id);
  await tx.auditLog.create({data:{userId:customer.id,action:'customer.onboarding',outcome:'success'}});
 });
 return plan;
}
export async function completeOnboarding(form:FormData){
 const plan=await createWorkspace(await requireCustomer(),form);
 redirect('/welcome?plan='+plan);
}
export async function submitOnboarding(_previous:OnboardingState,form:FormData):Promise<OnboardingState>{
 // Authentication redirects must remain outside the recoverable database boundary.
 const customer=await requireCustomer();
 let plan:string;
 try{plan=await createWorkspace(customer,form)}catch(error){
  if(error instanceof z.ZodError)return {message:'Check your name, timezone, currency and selected modules. Use Back to update your setup.'};
  return {message:'Could not create your workspace. Your choices are still here. Try again, or contact support if the problem continues.'};
 }
 redirect('/welcome?plan='+plan);
}
