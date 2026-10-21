import {it,expect,vi,beforeEach} from 'vitest';
const run=vi.hoisted(()=>vi.fn());vi.mock('server-only',()=>({}));vi.mock('@/features/admin/database',()=>({withAdminDatabase:run}));
import {GET} from '@/app/api/admin/metrics/route';
const request=(auth?:string)=>new Request('https://example.org/api/admin/metrics?from=2026-10-01&to=2026-10-20',{headers:auth?{Authorization:auth}:{}});
beforeEach(()=>vi.resetAllMocks());
it('rejects malformed bearer headers before database access',async()=>{for(const value of [undefined,'Bearer wrong','Basic credentials'])expect((await GET(request(value))).status).toBe(401);expect(run).not.toHaveBeenCalled()});
it('returns no-cache errors for revoked/rate-limited/unconfigured credentials',async()=>{const token='Bearer pluto_admin_'+'a'.repeat(43);for(const [error,status] of [['unauthorized',401],['rate_limited',429]] as const){run.mockResolvedValue([{metrics:{error}}]);const result=await GET(request(token));expect(result.status).toBe(status);expect(result.headers.get('cache-control')).toContain('no-store')}run.mockRejectedValue(Error('SENSITIVE_DATABASE_URL'));const result=await GET(request(token));expect(result.status).toBe(503);expect(await result.text()).not.toContain('SENSITIVE_DATABASE_URL')});
