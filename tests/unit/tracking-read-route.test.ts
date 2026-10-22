import {it,expect,vi,beforeEach} from 'vitest';
const mocks=vi.hoisted(()=>({owner:vi.fn(),read:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('@/features/auth/server',()=>({withCustomerRequest:async(work:()=>Promise<unknown>)=>{await mocks.owner();return work()}}));vi.mock('@/features/tracking/repository',()=>({readWorkspace:mocks.read}));
import {POST} from '@/app/api/tracking/read/route';
const request=(body='{"key":"Note","query":{}}',origin='http://localhost:3000')=>new Request('http://localhost:3000/api/tracking/read',{method:'POST',headers:{origin},body});
beforeEach(()=>{vi.unstubAllEnvs();vi.resetAllMocks();mocks.owner.mockResolvedValue({id:'owner'});mocks.read.mockResolvedValue({rows:[]})});
it('authenticates before parsing or querying',async()=>{mocks.owner.mockRejectedValue(Error('Denied'));await expect(POST(request('invalid'))).rejects.toThrow('Denied');expect(mocks.read).not.toHaveBeenCalled()});
it('rejects foreign origins, oversized and malformed inputs without querying',async()=>{expect((await POST(request(undefined,'https://example.invalid'))).status).toBe(403);expect((await POST(request('x'.repeat(8193)))).status).toBe(413);expect((await POST(request('{bad'))).status).toBe(400);expect(mocks.read).not.toHaveBeenCalled()});
it('returns private no-store data through the independently owner-checked repository',async()=>{const result=await POST(request());expect(result.status).toBe(200);expect(result.headers.get('cache-control')).toBe('private, no-store');expect(await result.json()).toEqual({rows:[]});expect(mocks.read).toHaveBeenCalledWith('Note',{})});
it('accepts the exact Render public origin behind an internal HTTP listener and refuses spoofed origins',async()=>{
 vi.stubEnv('RENDER','true');vi.stubEnv('RENDER_EXTERNAL_URL','https://synthetic.onrender.com');
 const proxied=(origin:string)=>new Request('http://localhost:10000/api/tracking/read',{method:'POST',headers:{origin,'x-forwarded-host':'evil.invalid','x-forwarded-proto':'https'},body:'{"key":"Assignment","query":{}}'});
 expect((await POST(proxied('https://synthetic.onrender.com'))).status).toBe(200);expect(mocks.read).toHaveBeenCalledWith('Assignment',{});mocks.read.mockClear();
 for(const origin of ['https://evil.invalid','http://synthetic.onrender.com','https://synthetic.onrender.com.evil.invalid','null',''])expect((await POST(proxied(origin))).status).toBe(403);expect(mocks.read).not.toHaveBeenCalled();vi.unstubAllEnvs();
});

it('requires the configured canonical origin even for localhost versus loopback aliases',async()=>{
 vi.stubEnv('PLUTO_SITE_URL','http://127.0.0.1:3002');
 const local=(origin:string)=>new Request('http://127.0.0.1:3002/api/tracking/read',{method:'POST',headers:{origin},body:'{"key":"Note","query":{}}'});
 expect((await POST(local('http://localhost:3002'))).status).toBe(403);expect(mocks.read).not.toHaveBeenCalled();expect((await POST(local('http://127.0.0.1:3002'))).status).toBe(200);
});
