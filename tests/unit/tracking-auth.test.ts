import { it,expect,vi,beforeEach } from 'vitest';
const mocks=vi.hoisted(()=>({owner:vi.fn(),read:vi.fn(),write:vi.fn(),inline:vi.fn(),remove:vi.fn(),choices:vi.fn(),transaction:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/features/auth/server',()=>({requireOwner:mocks.owner,withOwnerRequest:async(work:()=>Promise<unknown>)=>{await mocks.owner();return work()}}));
vi.mock('@/features/tracking/repository',()=>({readWorkspace:mocks.read,writeRecord:mocks.write,writeInlineNote:mocks.inline,removeRecord:mocks.remove,readLinkedChoices:mocks.choices}));
vi.mock('@/lib/db',()=>({db:{$transaction:mocks.transaction}}));
import {loadTracking,saveTracking,saveBudget,saveInlineNote,deleteTracking,searchLinkedChoices} from '@/features/tracking/actions';
import {withOwnerDatabase} from '@/lib/owner-db';
beforeEach(()=>{vi.resetAllMocks();mocks.owner.mockRejectedValue(new Error('Unauthorized'))});
it('every tracking action authenticates before touching records',async()=>{
 await expect(saveInlineNote({},'id','version')).rejects.toThrow('Unauthorized');expect(mocks.inline).not.toHaveBeenCalled();
 await expect(saveBudget({})).rejects.toThrow('Unauthorized');expect(mocks.transaction).not.toHaveBeenCalled();
 await expect(loadTracking('Note',{})).rejects.toThrow('Unauthorized');await expect(saveTracking('Note',{})).rejects.toThrow('Unauthorized');await expect(deleteTracking('Note','id','time')).rejects.toThrow('Unauthorized');await expect(searchLinkedChoices('Transaction','accountId','')).rejects.toThrow('Unauthorized');expect(mocks.read).not.toHaveBeenCalled();expect(mocks.write).not.toHaveBeenCalled();expect(mocks.remove).not.toHaveBeenCalled();expect(mocks.choices).not.toHaveBeenCalled();
});
it('the repository database boundary separately verifies identity',async()=>{await expect(withOwnerDatabase(async()=>null)).rejects.toThrow('Unauthorized');expect(mocks.transaction).not.toHaveBeenCalled()});
