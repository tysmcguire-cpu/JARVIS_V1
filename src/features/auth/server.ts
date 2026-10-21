import 'server-only';
import {redirect} from 'next/navigation';
import {createAuthClient} from '@/lib/supabase/server';
import {getAuthConfig} from '@/lib/env';
import {verifiedCustomer} from './policy';
import {cache} from 'react';
import {AsyncLocalStorage} from 'node:async_hooks';
import type {User} from '@supabase/supabase-js';
const customerRequest=new AsyncLocalStorage<User>();
const verifyIdentity=cache(async()=>{
 if(!getAuthConfig())redirect('/login?status=configuration');
 const {data,error}=await (await createAuthClient()).auth.getUser();
 if(error||!verifiedCustomer(data.user))redirect('/login?status=unauthorized');
 return data.user!;
});
export async function requireIdentity(){return verifyIdentity()}
const verifyCustomer=cache(async()=>{
 const customer=await requireIdentity();
 if(process.env.PLUTO_REQUIRE_MFA==='true'||customer.factors?.some(f=>f.status==='verified')){
  const {data,error}=await (await createAuthClient()).auth.getClaims();
  if(error||data?.claims.aal!=='aal2'||data.claims.sub!==customer.id)redirect('/mfa');
 }
 return customer;
});
export async function requireCustomer(){return customerRequest.getStore()??verifyCustomer()}
export async function withCustomerRequest<T>(work:()=>Promise<T>){return customerRequest.run(await requireCustomer(),work)}
