'use server';
import {z} from 'zod';
import {redirect} from 'next/navigation';
import {requireIdentity} from './server';
import {createAuthClient} from '@/lib/supabase/server';
import {randomUUID} from 'node:crypto';
export async function enrollMfa(){
 const owner=await requireIdentity(),client=await createAuthClient();
 if(owner.factors?.some(f=>f.status==='verified')){const claims=await client.auth.getClaims();if(claims.error||claims.data?.claims.aal!=='aal2'||claims.data.claims.sub!==owner.id)throw Error('Verify your existing authenticator first.');}
 const {data,error}=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'PLUTO owner '+randomUUID().slice(0,8)});if(error||!data)throw Error('Authenticator setup unavailable. Check your Supabase MFA configuration.');
 return {factorId:data.id,secret:data.totp.secret};
}
export async function verifyMfa(factorInput:unknown,codeInput:unknown,next:unknown='workspace'){
 const owner=await requireIdentity(),factor=z.uuid().parse(factorInput),code=z.string().regex(/^\d{6}$/).parse(codeInput),client=await createAuthClient();
 if(!owner.factors?.some(f=>f.id===factor))throw Error('Authenticator unavailable. Reload the verification page.');
 const {error}=await client.auth.mfa.challengeAndVerify({factorId:factor,code});if(error)throw Error('Code not accepted. Try a current authenticator code.');redirect(next==='admin'?'/admin':'/');
}
