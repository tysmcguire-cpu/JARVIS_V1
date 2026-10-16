import 'server-only';
import {createHash} from 'node:crypto';
import {XMLParser,XMLValidator} from 'fast-xml-parser';
import ICAL from 'ical.js';
import {z} from 'zod';
import {ConnectorAuthError,ConnectorRateLimit,type Credentials,type ReadOnlyConnector,type SourceRecord} from './contract';
import {validateSource} from './normalization';
import type {AuthorizedGrant} from './http-providers';

export const appleCredentialsSchema=z.object({approved:z.literal(true),username:z.email().max(254),password:z.string().min(16).max(100).refine(v=>!/[\r\n]/.test(v))}).strict();
type AppleCredentials=z.infer<typeof appleCredentialsSchema>;
type ObjectMap=Record<string,unknown>;
const object=(value:unknown):ObjectMap=>value&&typeof value==='object'&&!Array.isArray(value)?value as ObjectMap:{};
const array=(value:unknown):unknown[]=>value===undefined?[]:Array.isArray(value)?value:[value];
const text=(value:unknown)=>typeof value==='string'?value:typeof object(value)['#text']==='string'?object(value)['#text'] as string:'';
const xml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));

export function appleUrl(input:string,base?:URL,collection?:URL){
 if(!input.trim())throw Error('Missing calendar URL.');
 const url=new URL(input,base);
 if(url.protocol!=='https:'||! /^(?:p\d{1,3}-)?caldav\.icloud\.com$/.test(url.hostname)||url.username||url.password||url.port||url.search||url.hash||url.href.length>500||/%(?:2e|2f|5c|25)/i.test(url.pathname)||url.pathname.includes('\\'))throw Error('Only private iCloud CalDAV URLs are supported.');
 if(collection&&(url.origin!==collection.origin||!url.pathname.startsWith(collection.pathname)))throw Error('Calendar response left the selected collection.');
 return url;
}
async function boundedXml(response:Response){
 const reader=response.body?.getReader();if(!reader)throw Error('Empty calendar response.');let size=0;const chunks:Uint8Array[]=[];
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>2097152){await reader.cancel();throw Error('Calendar response exceeded 2 MiB.');}chunks.push(part.value);}
 const value=Buffer.concat(chunks).toString('utf8');if(/<!DOCTYPE|<!ENTITY/i.test(value)||XMLValidator.validate(value)!==true)throw Error('Invalid calendar XML.');
 const parsed=new XMLParser({removeNSPrefix:true,ignoreAttributes:false,parseTagValue:false,trimValues:false,processEntities:true}).parse(value);
 if(!('multistatus' in object(parsed)))throw Error('Invalid calendar response.');
 const rows=array(object(object(parsed).multistatus).response).map(object);if(rows.length>5001)throw Error('Calendar collection exceeds 5000 objects.');return rows;
}
async function request(url:URL,method:'PROPFIND'|'REPORT',body:string,credentials:AppleCredentials,fetcher:typeof fetch,depth='0',collection?:URL){
 for(let redirect=0;redirect<3;redirect++){
 let response:Response;
 try{response=await fetcher(url,{method,headers:{Authorization:'Basic '+Buffer.from(credentials.username+':'+credentials.password).toString('base64'),'Content-Type':'application/xml; charset=utf-8',Accept:'application/xml',...(method==='PROPFIND'?{Depth:depth}:{})},body,redirect:'manual',signal:AbortSignal.timeout(15000),cache:'no-store'});}catch{throw Error('iCloud calendar request unavailable.');}
 if([301,302,307,308].includes(response.status)){const location=response.headers.get('location');if(!location)throw Error('Invalid iCloud redirect.');url=appleUrl(location,url,collection);continue;}
 if(response.status===401||response.status===403)throw new ConnectorAuthError();
 if(response.status===429)throw new ConnectorRateLimit(Math.min(3600,Math.max(1,Number(response.headers.get('retry-after'))||60)));
 if(response.status!==207)throw Error('iCloud calendar request failed.');
 return {url,rows:await boundedXml(response)};
 }
 throw Error('Too many iCloud redirects.');
}
function props(row:ObjectMap){if(/\s(?:401|403)(?:\s|$)/.test(text(row.status)))throw new ConnectorAuthError();const result:ObjectMap={};for(const item of array(row.propstat)){const stat=object(item);if(/\s200(?:\s|$)/.test(text(stat.status)))Object.assign(result,object(stat.prop));else if(/\s(?:401|403)(?:\s|$)/.test(text(stat.status)))throw new ConnectorAuthError();}return result;}
const properties=(body:string)=>`<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop>${body}</d:prop></d:propfind>`;

export async function discoverAppleCalendars(input:unknown,fetcher:typeof fetch=fetch){
 const credentials=appleCredentialsSchema.parse(input);
 const root=await request(new URL('https://caldav.icloud.com/'),'PROPFIND',properties('<d:current-user-principal/>'),credentials,fetcher);
 const principalHref=root.rows.map(row=>text(object(props(row)['current-user-principal']).href)).find(Boolean);if(!principalHref)throw Error('iCloud principal unavailable.');
 const principal=await request(appleUrl(principalHref,root.url),'PROPFIND',properties('<c:calendar-home-set/>'),credentials,fetcher);
 const homeHref=principal.rows.map(row=>text(object(props(row)['calendar-home-set']).href)).find(Boolean);if(!homeHref)throw Error('iCloud calendar home unavailable.');
 const home=appleUrl(homeHref,principal.url);
 const listing=await request(home,'PROPFIND',properties('<d:displayname/><d:resourcetype/><c:supported-calendar-component-set/>'),credentials,fetcher,'1');
 const calendars:{url:string;name:string}[]=[];
 for(const row of listing.rows){const p=props(row);if(!('calendar' in object(p.resourcetype)))continue;const components=array(object(p['supported-calendar-component-set']).comp).map(v=>text(object(v)['@_name']));if(components.length&&!components.includes('VEVENT'))continue;
 const url=appleUrl(text(row.href),listing.url);if(!url.pathname.endsWith('/'))throw Error('Invalid calendar collection.');calendars.push({url:url.href,name:(text(p.displayname)||'iCloud calendar').slice(0,200)});}
 if(calendars.length>100)throw Error('Too many calendars to display.');return [...new Map(calendars.map(c=>[c.url,c])).values()];
}
function recordsFromIcs(content:string,resource:URL):SourceRecord[]{
 let component:ICAL.Component;try{component=new ICAL.Component(ICAL.parse(content));}catch{throw Error('Invalid iCalendar event.');}
 const events=component.getAllSubcomponents('vevent');if(!events.length)return [];if(events.length>1000)throw Error('Too many recurrence exceptions.');
 const event=events.find(e=>!e.hasProperty('recurrence-id'))??events[0];const uid=String(event.getFirstPropertyValue('uid')??'');if(!uid||events.some(e=>String(e.getFirstPropertyValue('uid')??'')!==uid))throw Error('Invalid calendar event identity.');
 const value=(key:string)=>String(event.getFirstPropertyValue(key)??'');
 const time=(key:string)=>{const property=event.getFirstProperty(key);return JSON.stringify({value:String(property?.getFirstValue()??''),timeZone:property?.getParameter('tzid')??(String(property?.getFirstValue()??'').endsWith('Z')?'UTC':'floating or all-day')});};
 const sourceTime=event.getFirstPropertyValue('last-modified')??event.getFirstPropertyValue('dtstamp');
 if(!(sourceTime instanceof ICAL.Time)||sourceTime.zone!==ICAL.Timezone.utcTimezone)throw Error('Calendar event timestamp unavailable.');
 return [validateSource({externalId:createHash('sha256').update(resource.href).digest('hex'),kind:'Event',sourceUrl:'https://www.icloud.com/calendar/',sourceUpdatedAt:sourceTime.toJSDate().toISOString(),deleted:value('status').toUpperCase()==='CANCELLED',data:{title:(value('summary')||'iCloud event (no title supplied)').slice(0,200),description:value('description').slice(0,8000),start:time('dtstart'),end:time('dtend'),location:value('location').slice(0,200),recurrence:value('rrule').slice(0,2000),recurrenceExceptions:String(events.length-1),timestampBasis:event.hasProperty('last-modified')?'event last-modified':'event dtstamp',coverage:'iCloud VEVENT snapshot; recurrence instances and exceptions are not expanded. No external edits.'}})];
}
export function createAppleCalendarConnector(grant:AuthorizedGrant,fetcher:typeof fetch=fetch):ReadOnlyConnector{
 const credentials=appleCredentialsSchema.parse({approved:grant.approved,username:grant.appleUsername,password:grant.credentials?.accessToken});
 z.object({accessToken:z.string(),expiresAt:z.number().finite().positive()}).parse(grant.credentials);
 const selected=z.array(z.string().min(1).max(500)).min(1).max(20).parse(grant.resources).map(value=>appleUrl(value));if(selected.some(url=>!url.pathname.endsWith('/'))||new Set(selected.map(url=>url.href)).size!==selected.length)throw Error('Select unique iCloud calendar collections.');
 // Per-sync memory only; no private cross-request cache or credentials in cursors.
 const listings=new Map<string,string[]>();let total=0;
 return {provider:'apple-calendar',mode:'live',async authorize(){return {...grant.credentials}},async refresh(){throw new ConnectorAuthError()},async disconnect(){},normalize:validateSource,async fetchPage(_credentials:Credentials,page){
 const [indexText,offsetText]=(page??'0:0').split(':');const index=Number(indexText),offset=Number(offsetText);if(!/^\d+:\d+$/.test(page??'0:0')||!Number.isSafeInteger(index)||!Number.isSafeInteger(offset)||index<0||index>=selected.length||offset<0||offset%100!==0)throw Error('Invalid iCloud cursor.');
 const calendar=selected[index];let objects=listings.get(calendar.href);
 if(!objects){const listing=await request(calendar,'PROPFIND',properties('<d:getetag/><d:resourcetype/>'),credentials,fetcher,'1',calendar);const found:string[]=[];for(const row of listing.rows){const p=props(row);if('collection' in object(p.resourcetype))continue;if(!text(p.getetag))throw Error('Calendar item unavailable.');const url=appleUrl(text(row.href),calendar,calendar);if(url.href===calendar.href)continue;found.push(url.href);}objects=[...new Set(found)].sort();total+=objects.length;if(total>10000)throw Error('Selected calendars exceed 10000 objects.');listings.set(calendar.href,objects);}
 if(offset>objects.length)throw Error('Invalid iCloud page offset.');
 const chunk=objects.slice(offset,offset+100),records:SourceRecord[]=[];
 if(chunk.length){const allowed=new Set(chunk);const report=`<?xml version="1.0" encoding="utf-8"?><c:calendar-multiget xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:getetag/><c:calendar-data/></d:prop>${chunk.map(h=>'<d:href>'+xml(new URL(h).pathname)+'</d:href>').join('')}</c:calendar-multiget>`;
 const result=await request(calendar,'REPORT',report,credentials,fetcher,'1',calendar);const returned=new Set<string>();for(const row of result.rows){const url=appleUrl(text(row.href),calendar,calendar);if(!allowed.has(url.href)||returned.has(url.href))throw Error('Unselected or repeated calendar item.');returned.add(url.href);if(/\s404(?:\s|$)/.test(text(row.status)))continue;if(text(row.status)&&!/\s200(?:\s|$)/.test(text(row.status)))throw Error('Calendar item could not be read.');const p=props(row),content=text(p['calendar-data']);if(!content)throw Error('Calendar event content unavailable.');records.push(...recordsFromIcs(content,url));}if(returned.size!==allowed.size)throw Error('Incomplete calendar response.');}
 return {records,nextPage:offset+100<objects.length?`${index}:${offset+100}`:index+1<selected.length?`${index+1}:0`:null,cursor:'apple-full-v1'};
 }};
}
