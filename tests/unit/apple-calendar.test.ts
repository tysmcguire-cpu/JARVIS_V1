import {it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {appleUrl,discoverAppleCalendars} from '@/features/integrations/apple-calendar';
import {createReadOnlyConnector} from '@/features/integrations/http-providers';
import {ConnectorAuthError,ConnectorRateLimit} from '@/features/integrations/contract';
const calendar='https://p01-caldav.icloud.com/123/calendars/synthetic/';
const credentials={accessToken:'synthetic-app-password',expiresAt:Number.MAX_SAFE_INTEGER};
const grant={approved:true as const,appleUsername:'synthetic@example.invalid',credentials,resources:[calendar]};
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const multi=(body:string)=>`<?xml version="1.0"?><d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">${body}</d:multistatus>`;
const row=(href:string,prop:string)=>`<d:response><d:href>${href}</d:href><d:propstat><d:prop>${prop}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
const response=(body:string,status=207,headers={})=>new Response(body,{status,headers});
const ics=['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','UID:synthetic-event','DTSTAMP:20261015T120000Z','DTSTART;TZID=America/Chicago:20261020T090000','DTEND;TZID=America/Chicago:20261020T100000','SUMMARY:Synthetic meeting & review','RRULE:FREQ=WEEKLY','END:VEVENT','END:VCALENDAR'].join('\r\n');
const listing=(count=1)=>multi(row(calendar,'<d:resourcetype><d:collection/><c:calendar/></d:resourcetype>')+Array.from({length:count},(_,i)=>row(calendar+`event-${i}.ics`,'<d:getetag>"synthetic"</d:getetag><d:resourcetype/>')).join(''));
const report=(href=calendar+'event-0.ics',content=ics)=>multi(row(href,'<d:getetag>"synthetic"</d:getetag><c:calendar-data>'+escape(content)+'</c:calendar-data>'));
it('discovers only VEVENT calendars after explicit consent, without reading event bodies',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(response(multi(row('/','<d:current-user-principal><d:href>/123/principal/</d:href></d:current-user-principal>')))).mockResolvedValueOnce(response(multi(row('/123/principal/','<c:calendar-home-set><d:href>'+calendar.slice(0,calendar.indexOf('synthetic/'))+'</d:href></c:calendar-home-set>')))).mockResolvedValueOnce(response(multi(row(calendar,'<d:displayname>Synthetic calendar</d:displayname><d:resourcetype><d:collection/><c:calendar/></d:resourcetype><c:supported-calendar-component-set><c:comp name="VEVENT"/></c:supported-calendar-component-set>')+row(calendar+'tasks/','<d:resourcetype><c:calendar/></d:resourcetype><c:supported-calendar-component-set><c:comp name="VTODO"/></c:supported-calendar-component-set>'))));
 await expect(discoverAppleCalendars({approved:false,username:grant.appleUsername,password:credentials.accessToken},fetcher)).rejects.toThrow();expect(fetcher).not.toHaveBeenCalled();
 expect(await discoverAppleCalendars({approved:true,username:grant.appleUsername,password:credentials.accessToken},fetcher)).toEqual([{name:'Synthetic calendar',url:calendar}]);
 expect(fetcher.mock.calls.every(call=>call[1].method==='PROPFIND')).toBe(true);expect(fetcher.mock.calls.some(call=>String(call[1].body).includes('calendar-data'))).toBe(false);
});
it('reads selected private events with source timestamps and timezone/recurrence limitations',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(response(listing())).mockResolvedValueOnce(response(report()));
 const connector=createReadOnlyConnector('apple-calendar',grant,fetcher),batch=await connector.fetchPage(credentials,null,null);
 expect(batch.records).toHaveLength(1);expect(batch.records[0]).toMatchObject({kind:'Event',sourceUrl:'https://www.icloud.com/calendar/',sourceUpdatedAt:'2026-10-15T12:00:00.000Z',data:{title:'Synthetic meeting & review',recurrence:'FREQ=WEEKLY'}});
 expect(JSON.parse((batch.records[0] as {data:{start:string}}).data.start).timeZone).toBe('America/Chicago');
 expect(fetcher.mock.calls.map(call=>call[1].method)).toEqual(['PROPFIND','REPORT']);expect(fetcher.mock.calls[1][1].headers).not.toHaveProperty('Depth');expect(fetcher.mock.calls.every(call=>call[1].redirect==='manual')).toBe(true);
});
it('bounds pages to 100 objects, keeps calendars separate, and does not refresh app passwords',async()=>{
 const fetcher=vi.fn(async(_url:unknown,options:RequestInit={})=>{if(options.method==='PROPFIND')return response(listing(101));const body=String(options.body),ids=[...body.matchAll(/<d:href>(.*?)<\/d:href>/g)].map(m=>m[1]);return response(multi(ids.map(h=>row(h,'<c:calendar-data>'+escape(ics)+'</c:calendar-data>')).join('')));});
 const connector=createReadOnlyConnector('apple-calendar',grant,fetcher);const first=await connector.fetchPage(credentials,null,null);expect(first.records).toHaveLength(100);expect(first.nextPage).toBe('0:100');const second=await connector.fetchPage(credentials,first.nextPage,null);expect(second.records).toHaveLength(1);expect(second.nextPage).toBeNull();expect(fetcher).toHaveBeenCalledTimes(3);await expect(connector.refresh(credentials)).rejects.toBeInstanceOf(ConnectorAuthError);
});
it('rejects untrusted destinations and redirects before forwarding credentials',async()=>{
 for(const url of ['http://caldav.icloud.com/','https://attacker.invalid/','https://caldav.icloud.com.attacker.invalid/','https://user:pass@caldav.icloud.com/','https://caldav.icloud.com:123/','https://caldav.icloud.com/a?token=x','https://caldav.icloud.com/a/%252f/'])expect(()=>appleUrl(url)).toThrow();
 const fetcher=vi.fn().mockResolvedValue(response('',307,{location:'https://attacker.invalid/'}));const connector=createReadOnlyConnector('apple-calendar',grant,fetcher);await expect(connector.fetchPage(credentials,null,null)).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(1);
 const escaped=vi.fn().mockResolvedValue(response(multi(row('/123/calendars/other/event.ics','<d:getetag>x</d:getetag>'))));await expect(createReadOnlyConnector('apple-calendar',grant,escaped).fetchPage(credentials,null,null)).rejects.toThrow('selected collection');
});
it('fails closed on XML entities, missing objects and malformed event data',async()=>{
 const entity=vi.fn().mockResolvedValue(response('<?xml version="1.0"?><!DOCTYPE x [<!ENTITY secret SYSTEM "file:///etc/passwd">]><d:multistatus xmlns:d="DAV:"/>'));await expect(createReadOnlyConnector('apple-calendar',grant,entity).fetchPage(credentials,null,null)).rejects.toThrow('Invalid calendar XML');
 for(const body of [multi(''),report(calendar+'unexpected.ics'),report(calendar+'event-0.ics','not an event'),report(calendar+'event-0.ics',ics.replace('DTSTAMP:20261015T120000Z\r\n',''))]){const fetcher=vi.fn().mockResolvedValueOnce(response(listing())).mockResolvedValueOnce(response(body));await expect(createReadOnlyConnector('apple-calendar',grant,fetcher).fetchPage(credentials,null,null)).rejects.toThrow();}
});
it('honors authentication/rate limits and enforces the response size bound',async()=>{
 for(const [status,type] of [[401,ConnectorAuthError],[429,ConnectorRateLimit]] as const){const fetcher=vi.fn().mockResolvedValue(response('',status,{'retry-after':'120'}));await expect(createReadOnlyConnector('apple-calendar',grant,fetcher).fetchPage(credentials,null,null)).rejects.toBeInstanceOf(type);}
 const fetcher=vi.fn().mockResolvedValue(response('x'.repeat(2097153)));await expect(createReadOnlyConnector('apple-calendar',grant,fetcher).fetchPage(credentials,null,null)).rejects.toThrow('2 MiB');
});
