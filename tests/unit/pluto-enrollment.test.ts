import {it,expect,vi,beforeEach,afterEach} from 'vitest';
const state=vi.hoisted(()=>({existing:false,write:vi.fn(),identity:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw Error('redirect:'+url)}}));
vi.mock('@/features/auth/server',()=>({requireCustomer:state.identity}));
vi.mock('@/features/commercial/installation',()=>({assertInstallation:async()=>{}}));
vi.mock('@/lib/db',()=>({db:{$transaction:async(work:(tx:unknown)=>unknown)=>work({$queryRaw:async()=>[],$queryRawUnsafe:async(sql:string)=>sql.startsWith('SELECT status')&&state.existing?[{status:'active'}]:[],$executeRawUnsafe:state.write,auditLog:{create:state.write}})}}));
import {completeOnboarding} from '@/features/auth/onboarding-actions';
function form(){const f=new FormData();f.set('displayName','Synthetic customer');f.set('timezone','UTC');f.set('currency','USD');return f}
beforeEach(()=>{vi.clearAllMocks();state.existing=false;state.identity.mockResolvedValue({id:'11111111-1111-4111-8111-111111111111',email:'synthetic@example.invalid'});vi.stubEnv('PLUTO_STAGE','closed_beta');vi.stubEnv('PLUTO_BETA_EMAILS','')});
afterEach(()=>vi.unstubAllEnvs());
it('rejects new uninvited profiles even when Auth was created outside the registration form',async()=>{await expect(completeOnboarding(form())).rejects.toThrow('enrollment');expect(state.write).not.toHaveBeenCalled()});
it('allows invited enrollment and preserves existing customer access after invitation removal',async()=>{vi.stubEnv('PLUTO_BETA_EMAILS','synthetic@example.invalid');await expect(completeOnboarding(form())).rejects.toThrow('redirect:/welcome');expect(state.write).toHaveBeenCalled();state.existing=true;vi.stubEnv('PLUTO_BETA_EMAILS','');await expect(completeOnboarding(form())).rejects.toThrow('redirect:/welcome')});
