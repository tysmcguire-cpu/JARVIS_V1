import {it,expect,vi,beforeEach} from 'vitest';
const mocks=vi.hoisted(()=>({owner:vi.fn(),read:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('@/features/auth/server',()=>({withOwnerRequest:async(work:()=>Promise<unknown>)=>{await mocks.owner();return work()}}));vi.mock('@/features/tracking/repository',()=>({readWorkspace:mocks.read}));
import {POST} from '@/app/api/tracking/read/route';
const request=(body='{"key":"Note","query":{}}',origin='http://localhost:3000')=>new Request('http://localhost:3000/api/tracking/read',{method:'POST',headers:{origin},body});
beforeEach(()=>{vi.resetAllMocks();mocks.owner.mockResolvedValue({id:'owner'});mocks.read.mockResolvedValue({rows:[]})});
it('authenticates before parsing or querying',async()=>{mocks.owner.mockRejectedValue(Error('Denied'));await expect(POST(request('invalid'))).rejects.toThrow('Denied');expect(mocks.read).not.toHaveBeenCalled()});
it('rejects foreign origins, oversized and malformed inputs without querying',async()=>{expect((await POST(request(undefined,'https://example.invalid'))).status).toBe(403);expect((await POST(request('x'.repeat(8193)))).status).toBe(413);expect((await POST(request('{bad'))).status).toBe(400);expect(mocks.read).not.toHaveBeenCalled()});
it('returns private no-store data through the independently owner-checked repository',async()=>{const result=await POST(request());expect(result.status).toBe(200);expect(result.headers.get('cache-control')).toBe('private, no-store');expect(await result.json()).toEqual({rows:[]});expect(mocks.read).toHaveBeenCalledWith('Note',{})});
