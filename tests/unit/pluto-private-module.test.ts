import {it,expect,vi} from 'vitest';
import {createElement,type ReactNode} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
vi.mock('server-only',()=>({}));
vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw Error('redirect:'+url)},notFound:()=>{throw Error('not found')}}));
vi.mock('@/features/shell/shell',()=>({Shell:({children}:{children:ReactNode})=>createElement('main',{},children)}));
vi.mock('@/features/shell/module-page',()=>({ModulePage:({slug,demo}:{slug:string;demo:boolean})=>createElement('section',{'data-module':slug,'data-demo':String(demo)},'Commercial module')}));
vi.mock('@/features/settings/repository',()=>({readSettings:vi.fn(async()=>null)}));
vi.mock('@/features/tracking/workspace',()=>({TrackingWorkspace:()=>null}));
vi.mock('@/features/tracking/repository',()=>({readWorkspace:vi.fn()}));
vi.mock('@/features/notifications/panel',()=>({NotificationPanel:()=>null}));
vi.mock('@/features/notifications/repository',()=>({notificationState:vi.fn()}));
vi.mock('@/features/assistant/repository',()=>({history:()=>{throw Error('Legacy-only Assistant route must not be used')}}));
import Page from '@/app/(private)/[module]/page';
it('routes signed-in customers through the commercial Assistant module, matching the demo experience',async()=>{
 const page=await Page({params:Promise.resolve({module:'assistant'}),searchParams:Promise.resolve({})});
 const markup=renderToStaticMarkup(page);expect(markup).toContain('data-module="assistant"');expect(markup).toContain('data-demo="false"');expect(markup).toContain('Commercial module');
});
