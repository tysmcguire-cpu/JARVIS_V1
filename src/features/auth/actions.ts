'use server';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {getAuthConfig} from '@/lib/env';
import {createAuthClient} from '@/lib/supabase/server';
import {verifiedCustomer} from './policy';
import {features} from '@/features/commercial/flags';
import {requireCustomer} from './server';
const credentials=z.object({email:z.email().max(254),password:z.string().min(1).max(128)});
export async function signIn(form:FormData){
 if(!getAuthConfig())redirect('/login?status=configuration');
 const input=credentials.safeParse({email:form.get('email'),password:form.get('password')});if(!input.success)redirect('/login?status=invalid');
 const client=await createAuthClient(),{data,error}=await client.auth.signInWithPassword(input.data);
 if(error||!verifiedCustomer(data.user)){await client.auth.signOut();redirect('/login?status=invalid')}
 if(process.env.PLUTO_REQUIRE_MFA==='true'||data.user?.factors?.some(f=>f.status==='verified'))redirect(form.get('next')==='admin'?'/mfa?next=admin':'/mfa');
 redirect(form.get('next')==='admin'?'/admin':'/');
}
export async function register(form:FormData){
 if(!features.registration()||!getAuthConfig())redirect('/register?status=disabled');
 const input=credentials.extend({password:z.string().min(12).max(128)}).safeParse({email:form.get('email'),password:form.get('password')});if(!input.success)redirect('/register?status=invalid');
 const site=new URL(process.env.PLUTO_SITE_URL??'');if(site.protocol!=='https:'&&process.env.NODE_ENV==='production')throw Error('Secure site URL required');
 const {error}=await (await createAuthClient()).auth.signUp({...input.data,options:{emailRedirectTo:new URL('/auth/callback',site).toString()}});
 if(error)redirect('/register?status=unavailable');redirect('/login?status=verify-email');
}
export async function requestPasswordReset(form:FormData){
 if(getAuthConfig()){
  const email=z.email().max(254).safeParse(form.get('email'));
  if(email.success){const site=new URL(process.env.PLUTO_SITE_URL??'');if(site.protocol!=='https:'&&process.env.NODE_ENV==='production')throw Error('Secure site URL required');await (await createAuthClient()).auth.resetPasswordForEmail(email.data,{redirectTo:new URL('/auth/callback?next=reset-password',site).toString()})}
 }
 redirect('/forgot-password?status=sent');
}
export async function resetPassword(form:FormData){
 await requireCustomer();const password=z.string().min(12).max(128).parse(form.get('password'));
 const client=await createAuthClient(),{error}=await client.auth.updateUser({password});if(error)redirect('/reset-password?status=invalid');await client.auth.signOut({scope:'global'});redirect('/login?status=password-reset');
}
export async function signOut(){const {error}=await (await createAuthClient()).auth.signOut();if(error)throw Error('Sign out failed. Please try again.');redirect('/login')}
