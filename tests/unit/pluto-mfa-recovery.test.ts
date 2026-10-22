import {beforeEach,it,expect,vi} from 'vitest';
const customer='11111111-1111-4111-8111-111111111111',factor='22222222-2222-4222-8222-222222222222';
const state=vi.hoisted(()=>({identity:vi.fn(),claims:vi.fn(),verify:vi.fn(),enroll:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw Error('redirect:'+url)}}));
vi.mock('@/features/auth/server',()=>({requireIdentity:state.identity}));
vi.mock('@/lib/supabase/server',()=>({createAuthClient:async()=>({auth:{getClaims:state.claims,mfa:{challengeAndVerify:state.verify,enroll:state.enroll}}})}));
import {verifyMfa,enrollMfa} from '@/features/auth/mfa-actions';
import {authDestination,authDestinations,mfaHref} from '@/features/auth/destinations';
beforeEach(()=>{vi.resetAllMocks();state.identity.mockResolvedValue({id:customer,factors:[{id:factor,status:'verified'}]});state.verify.mockResolvedValue({error:null});state.claims.mockResolvedValue({data:{claims:{sub:customer,aal:'aal2'}},error:null});state.enroll.mockResolvedValue({data:{id:factor,totp:{secret:'synthetic-only'}},error:null})});
it('returns password recovery and administrator verification to fixed internal destinations',async()=>{
 for(const next of ['workspace','admin','reset-password'] as const){await expect(verifyMfa(factor,'123456',next)).rejects.toThrow('redirect:'+authDestinations[next]);expect(mfaHref(next)).toBe(next==='workspace'?'/mfa':'/mfa?next='+next)}
 for(const value of ['https://outside.invalid','//outside.invalid','javascript:alert(1)',undefined]){expect(authDestination(value)).toBe('workspace');await expect(verifyMfa(factor,'123456',value)).rejects.toThrow('redirect:/')}
});
it('rejects another factor, malformed codes and failed verification before navigating',async()=>{
 await expect(verifyMfa('33333333-3333-4333-8333-333333333333','123456','reset-password')).rejects.toThrow('unavailable');expect(state.verify).not.toHaveBeenCalled();await expect(verifyMfa(factor,'12345')).rejects.toThrow();expect(state.verify).not.toHaveBeenCalled();state.verify.mockResolvedValue({error:{message:'Private provider error'}});await expect(verifyMfa(factor,'123456')).rejects.toThrow('Code not accepted');
});
it('requires the existing factor and matching elevated subject before adding an authenticator',async()=>{
 for(const claims of [{sub:customer,aal:'aal1'},{sub:factor,aal:'aal2'}]){state.claims.mockResolvedValue({data:{claims},error:null});await expect(enrollMfa()).rejects.toThrow('existing authenticator')}
 expect(state.enroll).not.toHaveBeenCalled();state.claims.mockResolvedValue({data:{claims:{sub:customer,aal:'aal2'}},error:null});expect(await enrollMfa()).toEqual({factorId:factor,secret:'synthetic-only'});
});
