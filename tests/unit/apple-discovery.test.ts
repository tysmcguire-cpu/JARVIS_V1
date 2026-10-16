import {beforeEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({database:vi.fn(),discover:vi.fn(),query:vi.fn(),audit:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/owner-db',()=>({withOwnerDatabase:mocks.database}));
vi.mock('@/features/integrations/apple-calendar',async()=>({...await vi.importActual<typeof import('@/features/integrations/apple-calendar')>('@/features/integrations/apple-calendar'),discoverAppleCalendars:mocks.discover}));
import {discoverOwnerAppleCalendars} from '@/features/integrations/apple-discovery';
const input={approved:true,username:'synthetic@example.invalid',password:'synthetic-app-password'};
beforeEach(()=>{vi.resetAllMocks();mocks.query.mockResolvedValueOnce([]).mockResolvedValueOnce([{count:0n}]);mocks.audit.mockResolvedValue({});mocks.database.mockImplementation(async work=>work({$queryRawUnsafe:mocks.query,auditLog:{create:mocks.audit}},'synthetic-owner'));mocks.discover.mockResolvedValue([])});
it('requires independent owner authorization before reading calendar metadata',async()=>{
 mocks.database.mockRejectedValue(new Error('Unauthorized'));await expect(discoverOwnerAppleCalendars(input)).rejects.toThrow('Unauthorized');expect(mocks.discover).not.toHaveBeenCalled();
});
it('enforces the durable owner discovery budget before any provider request',async()=>{
 mocks.query.mockReset().mockResolvedValueOnce([]).mockResolvedValueOnce([{count:20n}]);await expect(discoverOwnerAppleCalendars(input)).rejects.toThrow('limit');expect(mocks.discover).not.toHaveBeenCalled();expect(mocks.audit).not.toHaveBeenCalled();
});
it('audits only the operation and requests metadata without saving credentials',async()=>{
 expect(await discoverOwnerAppleCalendars(input)).toEqual([]);expect(mocks.discover).toHaveBeenCalledWith(input);expect(mocks.audit).toHaveBeenCalledWith({data:{userId:'synthetic-owner',action:'integration.apple.discovery',outcome:'requested'}});expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain(input.password);expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain(input.username);
});
