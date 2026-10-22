import {it,expect,vi,beforeEach,afterEach} from 'vitest';
const state=vi.hoisted(()=>({existing:false,write:vi.fn(),identity:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw Error('redirect:'+url)}}));
vi.mock('@/features/auth/server',()=>({requireCustomer:state.identity}));
vi.mock('@/features/commercial/installation',()=>({assertInstallation:async()=>{}}));
vi.mock('@/lib/db',()=>({db:{$transaction:async(work:(tx:unknown)=>unknown)=>work({$queryRaw:async()=>[],$queryRawUnsafe:async(sql:string)=>sql.startsWith('SELECT status')&&state.existing?[{status:'active'}]:[],$executeRawUnsafe:state.write,auditLog:{create:state.write}})}}));
import {completeOnboarding,submitOnboarding} from '@/features/auth/onboarding-actions';
function form(){const f=new FormData();f.set('displayName','Synthetic customer');f.set('timezone','UTC');f.set('currency','USD');return f}
beforeEach(()=>{vi.clearAllMocks();state.existing=false;state.identity.mockResolvedValue({id:'11111111-1111-4111-8111-111111111111',email:'synthetic@example.invalid'});vi.stubEnv('PLUTO_STAGE','closed_beta');vi.stubEnv('PLUTO_BETA_EMAILS','')});
afterEach(()=>vi.unstubAllEnvs());
it('rejects new uninvited profiles even when Auth was created outside the registration form',async()=>{await expect(completeOnboarding(form())).rejects.toThrow('enrollment');expect(state.write).not.toHaveBeenCalled()});
it('allows invited enrollment and preserves existing customer access after invitation removal',async()=>{vi.stubEnv('PLUTO_BETA_EMAILS','synthetic@example.invalid');await expect(completeOnboarding(form())).rejects.toThrow('redirect:/welcome');expect(state.write).toHaveBeenCalled();state.existing=true;vi.stubEnv('PLUTO_BETA_EMAILS','');await expect(completeOnboarding(form())).rejects.toThrow('redirect:/welcome')});

it('returns a safe retryable result for a database failure without leaking private diagnostics',async()=>{
 vi.stubEnv('PLUTO_BETA_EMAILS','synthetic@example.invalid');state.write.mockRejectedValueOnce(Error('postgres://private-password@private-host: RLS failure'));
 const result=await submitOnboarding({message:''},form());expect(result.message).toContain('Your choices are still here');expect(result.message).not.toMatch(/postgres|private-password|private-host|RLS/);
 await expect(submitOnboarding(result,form())).rejects.toThrow('redirect:/welcome');
});
it('returns actionable validation feedback before attempting any database write',async()=>{
 const invalid=form();invalid.set('timezone','Not/A_Timezone');const result=await submitOnboarding({message:''},invalid);expect(result.message).toContain('timezone');expect(state.write).not.toHaveBeenCalled();
});
it('preserves authentication redirects instead of turning expired sessions into retry messages',async()=>{
 state.identity.mockRejectedValueOnce(Error('redirect:/login?status=unauthorized'));await expect(submitOnboarding({message:''},form())).rejects.toThrow('redirect:/login');expect(state.write).not.toHaveBeenCalled();
});

it('explains an invitation rejection without suggesting that retry alone will resolve it',async()=>{
 const result=await submitOnboarding({message:''},form());expect(result.message).toContain('invitation-only');expect(result.message).toContain('email address you used to sign in');expect(result.message).toContain('Your choices are still here');expect(state.write).not.toHaveBeenCalled();
 vi.stubEnv('PLUTO_BETA_EMAILS','synthetic@example.invalid');await expect(submitOnboarding(result,form())).rejects.toThrow('redirect:/welcome');
});
