import {it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {canvasFeedUrl,parseCanvasFeed,createCanvasFeedConnector} from '@/features/integrations/canvas-feed';
import {synchronize} from '@/features/integrations/contract';
const url='https://canvas.tamu.edu/feeds/calendars/user_synthetic-secret.ics';
const event=(id=1,extra='')=>`BEGIN:VEVENT\r\nUID:event-assignment-${id}\r\nDTSTAMP:20261017T120000Z\r\nDTSTART:20261020T010000Z\r\nSUMMARY:Synthetic assignment ${id}\r\nURL:https://canvas.tamu.edu/courses/1/assignments/${id}\r\n${extra}END:VEVENT\r\n`;
const feed=(events=event())=>'BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'+events+'END:VCALENDAR\r\n';
const grant={approved:true as const,canvasTransport:'feed' as const,resources:['calendar-feed'],credentials:{accessToken:url,expiresAt:Number.MAX_SAFE_INTEGER}};
it('accepts only private HTTPS Canvas feed routes and rejects alternate destinations before any request',()=>{
 expect(canvasFeedUrl(url).origin).toBe('https://canvas.tamu.edu');
 for(const bad of ['http://canvas.tamu.edu/feeds/calendars/user_x.ics','https://127.0.0.1/feeds/calendars/user_x.ics','https://canvas.tamu.edu.evil.test/feeds/calendars/user_x.ics','https://canvas.tamu.edu/api/v1/courses',url+'?secret=x',url+'#x',url.replace('https://','https://user:pass@'),url.replace('/feeds/','/other/../feeds/'),url.replace('user_','user_%2f')]){
  expect(()=>canvasFeedUrl(bad)).toThrow();
 }
 expect(()=>createCanvasFeedConnector({...grant,approved:false as true})).toThrow();
});
it('normalizes dated assignments and all-day events without exposing private feed links',()=>{
 const rows=parseCanvasFeed(feed(event()+event(2,'STATUS:CANCELLED\r\n').replace('DTSTART:20261020T010000Z','DTSTART;VALUE=DATE:20261021')),new URL(url).origin);
 expect(rows[0]).toMatchObject({kind:'Assignment',data:{dueAt:'2026-10-20T01:00:00.000Z'}});expect(rows[1]).toMatchObject({deleted:true,data:{dueAt:'2026-10-21'}});expect(JSON.stringify(rows)).not.toContain('synthetic-secret');
 const unsafe=feed(event().replace('https://canvas.tamu.edu/courses/1/assignments/1',url));expect(parseCanvasFeed(unsafe,new URL(url).origin)[0].sourceUrl).toBe('https://canvas.tamu.edu/calendar');
});
it('validates the complete snapshot before paging and rejects ambiguous timestamps, duplicates and oversized feeds',()=>{
 for(const invalid of ['<html>Login</html>',feed(event().replace('DTSTAMP:20261017T120000Z\r\n','')),feed(event().replace('DTSTART:20261020T010000Z','DTSTART:20261020T010000')),feed(event()+event()),feed(Array.from({length:1001},(_,i)=>event(i)).join(''))])expect(()=>parseCanvasFeed(invalid,new URL(url).origin)).toThrow();
 expect(parseCanvasFeed(feed(''),new URL(url).origin)).toEqual([]);
});
it('fetches once per sync with no password headers, pages 1000 events and uses stable identities',async()=>{
 const fetcher=vi.fn<typeof fetch>(async()=>new Response(feed(Array.from({length:201},(_,i)=>event(i)).join(''))));const connector=createCanvasFeedConnector(grant,fetcher),rows=new Map();
 const report=vi.fn();await synchronize(connector,grant.credentials,null,{credentials:vi.fn(),upsert:async records=>{for(const r of records)rows.set(r.externalId,r)},checkpoint:vi.fn(),report});
 expect(rows.size).toBe(201);expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher.mock.calls[0][1]).toMatchObject({method:'GET',redirect:'error',cache:'no-store',headers:{Accept:'text/calendar'}});expect(report).toHaveBeenCalledWith('healthy',201);
});
it('handles auth/rate limits and bounds responses without checkpointing failed snapshots',async()=>{
 for(const response of [new Response('',{status:403}),new Response('',{status:429,headers:{'retry-after':'90'}}),new Response('x'.repeat(2097153)),new Response('<html>login</html>')]){
  const checkpoint=vi.fn(),upsert=vi.fn();const connector=createCanvasFeedConnector(grant,vi.fn(async()=>response));await expect(synchronize(connector,grant.credentials,null,{credentials:vi.fn(),upsert,checkpoint,report:vi.fn()})).rejects.toThrow();expect(checkpoint).not.toHaveBeenCalled();expect(upsert).not.toHaveBeenCalled();
 }
});
