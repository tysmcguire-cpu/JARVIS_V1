import {it,expect,vi,beforeEach,afterEach} from 'vitest';
const mocks=vi.hoisted(()=>({signup:vi.fn(),reset:vi.fn(),update:vi.fn(),out:vi.fn(),identity:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('next/navigation',()=>({redirect:(to:string)=>{throw Error('redirect:'+to)}}));vi.mock('@/lib/env',()=>({getAuthConfig:()=>({})}));vi.mock('@/features/auth/server',()=>({requireCustomer:mocks.identity}));vi.mock('@/lib/supabase/server',()=>({createAuthClient:async()=>({auth:{signUp:mocks.signup,resetPasswordForEmail:mocks.reset,updateUser:mocks.update,signOut:mocks.out}})}));
import {register,requestPasswordReset,resetPassword,finishPasswordReset} from '@/features/auth/actions';
function form(){const f=new FormData();f.set('email','synthetic@example.invalid');f.set('password','Synthetic password only');return f}
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv('PLUTO_STAGE','development');vi.stubEnv('PLUTO_BETA_EMAILS','synthetic@example.invalid');vi.stubEnv('PLUTO_PUBLIC_REGISTRATION','false');vi.stubEnv('PLUTO_SITE_URL','https://pluto.example.invalid');mocks.signup.mockResolvedValue({error:null});mocks.reset.mockResolvedValue({error:null});mocks.identity.mockResolvedValue({id:'11111111-1111-4111-8111-111111111111'});mocks.update.mockResolvedValue({error:null});mocks.out.mockResolvedValue({error:null})});afterEach(()=>vi.unstubAllEnvs());
it('keeps public signup closed without contacting the provider',async()=>{await expect(register(form())).rejects.toThrow('disabled');expect(mocks.signup).not.toHaveBeenCalled()});
it('requests email verification with a pinned callback when explicitly enabled',async()=>{vi.stubEnv('PLUTO_PUBLIC_REGISTRATION','true');await expect(register(form())).rejects.toThrow('verify-email');expect(mocks.signup).toHaveBeenCalledWith(expect.objectContaining({options:{emailRedirectTo:'https://pluto.example.invalid/auth/callback'}}))});
it('validates credentials before signup and gives non-enumerating recovery responses',async()=>{vi.stubEnv('PLUTO_PUBLIC_REGISTRATION','true');await expect(register(new FormData())).rejects.toThrow('invalid');expect(mocks.signup).not.toHaveBeenCalled();await expect(requestPasswordReset(form())).rejects.toThrow('status=sent');mocks.reset.mockResolvedValue({error:{message:'Unknown account'}});await expect(requestPasswordReset(form())).rejects.toThrow('status=sent')});
it('requires verified authorization before changing a password and revokes sessions afterward',async()=>{mocks.identity.mockRejectedValueOnce(Error('Unauthorized'));await expect(resetPassword(form())).rejects.toThrow('Unauthorized');expect(mocks.update).not.toHaveBeenCalled();await expect(resetPassword(form())).rejects.toThrow('password-reset');expect(mocks.out).toHaveBeenCalledWith({scope:'global'})});

it('returns the same recovery response when email delivery throws or the site URL is absent',async()=>{
 mocks.reset.mockRejectedValueOnce(Error('Private mail error'));await expect(requestPasswordReset(form())).rejects.toThrow('status=sent');
 vi.stubEnv('PLUTO_SITE_URL','');mocks.reset.mockClear();await expect(requestPasswordReset(form())).rejects.toThrow('status=sent');expect(mocks.reset).not.toHaveBeenCalled();
});
it('rejects invalid passwords and handles provider failures without claiming success',async()=>{
 const invalid=form();invalid.set('password','short');await expect(resetPassword(invalid)).rejects.toThrow('status=invalid');expect(mocks.update).not.toHaveBeenCalled();
 mocks.update.mockRejectedValueOnce(Error('Private update failure'));await expect(resetPassword(form())).rejects.toThrow('status=invalid');expect(mocks.out).not.toHaveBeenCalled();expect(mocks.identity).toHaveBeenCalledWith('reset-password');
});
it('does not claim global session revocation succeeded when it failed, and allows a separate retry',async()=>{
 mocks.out.mockResolvedValueOnce({error:{message:'Failed'}});await expect(resetPassword(form())).rejects.toThrow('status=signout-failed');expect(mocks.update).toHaveBeenCalledOnce();
 await expect(finishPasswordReset()).rejects.toThrow('status=password-reset');expect(mocks.update).toHaveBeenCalledOnce();expect(mocks.out).toHaveBeenLastCalledWith({scope:'global'});
 mocks.out.mockRejectedValueOnce(Error('Network failure'));await expect(finishPasswordReset()).rejects.toThrow('status=signout-failed');
});
