import {it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({auth:vi.fn(async()=>{throw Error('Denied')}),data:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('@/features/auth/server',()=>({withOwnerRequest:async(work:()=>Promise<unknown>)=>{await mocks.auth();return work()}}));vi.mock('@/features/notifications/repository',()=>({notificationState:mocks.data,saveNotificationPreferences:mocks.data,refreshNotifications:mocks.data,updateNotification:mocks.data}));vi.mock('@/features/data-controls/repository',()=>({ownerExport:mocks.data,deleteOwnerAppData:mocks.data}));vi.mock('@/lib/supabase/server',()=>({createAuthClient:mocks.data}));
import {loadNotifications,saveNotifications,refreshNotificationInbox,changeNotification} from '@/features/notifications/actions';
import {GET} from '@/app/api/account/export/route';
import {POST} from '@/app/api/account/delete/route';
it('authenticates every notification action and data route before any read/write',async()=>{for(const operation of [()=>loadNotifications(),()=>saveNotifications({}),()=>refreshNotificationInbox(),()=>changeNotification('id','read'),()=>GET(),()=>POST(new Request('http://localhost:3000/api/account/delete',{method:'POST',body:'{}'}))])await expect(operation()).rejects.toThrow('Denied');expect(mocks.data).not.toHaveBeenCalled()});
