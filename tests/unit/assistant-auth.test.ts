import {it,expect,vi} from 'vitest';
const auth=vi.hoisted(()=>vi.fn(async()=>{throw Error('unauthorized')}));const data=vi.hoisted(()=>vi.fn());
vi.mock('server-only',()=>({}));vi.mock('@/features/auth/server',()=>({requireCustomer:auth}));vi.mock('@/features/assistant/repository',()=>({ask:data,history:data,detail:data,removeConversation:data}));
import {askAssistant,assistantHistory,assistantDetail,deleteAssistantConversation} from '@/features/assistant/actions';
it('independently authenticates all assistant actions before accessing records',async()=>{for(const action of [askAssistant,assistantHistory,assistantDetail,deleteAssistantConversation])await expect(action('untrusted')).rejects.toThrow('unauthorized');expect(auth).toHaveBeenCalledTimes(4);expect(data).not.toHaveBeenCalled()});
