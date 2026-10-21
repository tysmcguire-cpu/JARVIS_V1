import {it,expect,vi} from 'vitest';
const owner=vi.hoisted(()=>vi.fn(async()=>{throw Error('Denied')}));
vi.mock('server-only',()=>({}));vi.mock('@/features/auth/server',()=>({requireCustomer:owner}));vi.mock('@/lib/customer-db',()=>({withCustomerDatabase:vi.fn()}));
import {loadBankState,loadBankHistory,beginBankLink,resumeBankSession,finishBankLink,synchronizeBank,revokeBank} from '@/features/banking/actions';
it('checks the owner on every bank operation before input or provider handling',async()=>{const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);try{for(const call of [()=>loadBankState(),()=>loadBankHistory({}),()=>beginBankLink({}),()=>resumeBankSession('bad'),()=>finishBankLink({}),()=>synchronizeBank(),()=>revokeBank(true)])await expect(call()).rejects.toThrow('Denied');expect(fetcher).not.toHaveBeenCalled()}finally{vi.unstubAllGlobals()}});
