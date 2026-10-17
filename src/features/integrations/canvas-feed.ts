import 'server-only';
import {createHash} from 'node:crypto';
import ICAL from 'ical.js';
import {ConnectorAuthError,ConnectorRateLimit,type ReadOnlyConnector,type SourceRecord} from './contract';
import {validateSource} from './normalization';
import type {AuthorizedGrant} from './http-providers';

export function canvasFeedUrl(value:string){
 // Exact university host plus Canvas's documented feed route. Never follow redirects.
 if(value!==value.trim()||value.length>2000||/[\\\r\n]/.test(value)||/%(?:2e|2f|5c|25)/i.test(value)||value.includes('/../')||value.includes('/./'))throw Error('Enter a private Canvas calendar feed URL.');
 const url=new URL(value);
 if(url.protocol!=='https:'||!(url.hostname==='canvas.tamu.edu'||/^[a-z0-9-]+\.instructure\.com$/.test(url.hostname))||url.username||url.password||url.port||url.search||url.hash||!/^\/feeds\/calendars\/user_[A-Za-z0-9_-]+\.ics$/.test(url.pathname))throw Error('Use the Canvas Calendar Feed link from canvas.tamu.edu or your Instructure site.');
 return url;
}
function instant(value:unknown){
 if(!(value instanceof ICAL.Time))throw Error('Calendar date unavailable.');
 if(value.isDate)return value.toString();
 if(value.zone!==ICAL.Timezone.utcTimezone)throw Error('Canvas feed times must include UTC timezone.');
 return value.toJSDate().toISOString();
}
export function parseCanvasFeed(content:string,origin:string):SourceRecord[]{
 if(!/^BEGIN:VCALENDAR\r?\n/.test(content)||!content.trimEnd().endsWith('END:VCALENDAR'))throw Error('Invalid Canvas calendar feed.');
 let calendar:ICAL.Component;try{calendar=new ICAL.Component(ICAL.parse(content));}catch{throw Error('Invalid Canvas calendar feed.');}
 if(calendar.name!=='vcalendar')throw Error('Invalid Canvas calendar feed.');
 const events=calendar.getAllSubcomponents('vevent');if(events.length>1000)throw Error('Canvas feed exceeds 1000 events.');
 const ids=new Set<string>();
 return events.map(event=>{
  const value=(key:string)=>String(event.getFirstPropertyValue(key)??'');
  const uid=value('uid');if(!uid||uid.length>2000)throw Error('Invalid Canvas event identity.');
  const recurrenceId=value('recurrence-id');const externalId=createHash('sha256').update(JSON.stringify([uid,recurrenceId])).digest('hex');if(ids.has(externalId))throw Error('Repeated Canvas event identity.');ids.add(externalId);
  const source=event.getFirstPropertyValue('last-modified')??event.getFirstPropertyValue('dtstamp');
  if(!(source instanceof ICAL.Time)||source.isDate||source.zone!==ICAL.Timezone.utcTimezone)throw Error('Canvas event source timestamp unavailable.');
  const start=instant(event.getFirstPropertyValue('dtstart'));
  const summary=value('summary');const courseCode=/ \[([^\[\]]+)\]$/.exec(summary)?.[1]??'';let canvasCourseId='';
  try{const link=new URL(value('url'));if(link.origin===origin){canvasCourseId=/^course_(\d+)$/.exec(link.searchParams.get('include_contexts')??'')?.[1]??/^\/courses\/(\d+)\//.exec(link.pathname)?.[1]??'';}}catch{/* No course identifier provided. */}
  let sourceUrl=origin+'/calendar';try{const candidate=new URL(value('url'));if(candidate.origin===origin&&!candidate.search&&!candidate.hash&&/^\/courses\/\d+\/(?:assignments|quizzes|calendar_events)\/\d+$/.test(candidate.pathname))sourceUrl=candidate.href;}catch{/* Keep the nonsecret Canvas calendar landing page. */}
  return validateSource({externalId,kind:(uid.startsWith('event-assignment-')||uid.startsWith('event-sub-assignment-'))||sourceUrl.includes('/assignments/')?'Assignment':'Event',sourceUrl,sourceUpdatedAt:source.toJSDate().toISOString(),deleted:value('status').toUpperCase()==='CANCELLED',data:{courseCode:courseCode.slice(0,200),canvasCourseId:canvasCourseId.slice(0,20),title:(value('summary')||'Canvas calendar item').slice(0,200),description:value('description').slice(0,8000),dueAt:start,end:event.hasProperty('dtend')?instant(event.getFirstPropertyValue('dtend')):'',location:value('location').slice(0,200),recurrence:value('rrule').slice(0,2000),coverage:'Canvas calendar feed only; no grades or submission status. Recurrence rules are not expanded. Feed omission can mean the item left Canvas’s export window.'}});
 });
}
export function createCanvasFeedConnector(grant:AuthorizedGrant,fetcher:typeof fetch=fetch):ReadOnlyConnector{
 if(grant.approved!==true||grant.canvasTransport!=='feed'||grant.resources.length!==1||grant.resources[0]!=='calendar-feed'||![0,15,60,360].includes(grant.syncIntervalMinutes??0))throw Error('Approve the selected Canvas calendar feed.');
 const url=canvasFeedUrl(grant.credentials.accessToken);let records:SourceRecord[]|undefined;
 return {provider:'canvas',mode:'live',async authorize(){return {...grant.credentials}},async refresh(){throw new ConnectorAuthError()},async disconnect(){},normalize:validateSource,async fetchPage(_credentials,page){
  const offset=page===null?0:Number(page);if(!Number.isSafeInteger(offset)||offset<0||offset%100!==0)throw Error('Invalid feed cursor.');
  if(!records){let response:Response;try{response=await fetcher(url,{method:'GET',headers:{Accept:'text/calendar'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});}catch{throw Error('Canvas calendar feed unavailable.');}
   if(response.status===401||response.status===403)throw new ConnectorAuthError();if(response.status===429)throw new ConnectorRateLimit(Math.min(3600,Math.max(1,Number(response.headers.get('retry-after'))||60)));if(!response.ok)throw Error('Canvas calendar feed unavailable.');
   const reader=response.body?.getReader();if(!reader)throw Error('Empty Canvas response.');const chunks:Uint8Array[]=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>2097152){await reader.cancel();throw Error('Canvas feed exceeds 2 MiB.');}chunks.push(part.value);}
   records=parseCanvasFeed(Buffer.concat(chunks).toString('utf8'),url.origin);
  }
  if(offset>records.length)throw Error('Invalid feed cursor.');return {records:records.slice(offset,offset+100),nextPage:offset+100<records.length?String(offset+100):null,cursor:'canvas-feed-v1'};
 }};
}
