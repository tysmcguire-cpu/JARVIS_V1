import {z} from 'zod';
import {parseMoney} from '@/features/tracking/config';
import {ruleSettingsSchema,calendarWeek,type Kind,type RuleSettings} from './rules';
export type {Kind} from './rules';
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const preferencesSchema=z.object({timezone:z.string().max(100).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true}catch{return false}}),weeklyReviewEnabled:z.boolean(),weeklyReviewDay:z.number().int().min(0).max(6),weeklyReviewTime:time,deadlineReminders:z.boolean(),financialAlerts:z.boolean(),morningBriefingEnabled:z.boolean(),morningBriefingTime:time,notificationTelegramEnabled:z.boolean(),threshold:z.string().max(20).refine(v=>{try{return v===''||parseMoney(v)>0n}catch{return false}}),currency:z.enum(['USD','CAD','EUR','GBP']),leadDays:z.number().int().min(0).max(30),deadlineTime:time,expectedUpdatedAt:z.iso.datetime(),rules:ruleSettingsSchema.optional()}).strict();
export type Preferences=z.infer<typeof preferencesSchema> & {rules?:RuleSettings};
export type Settings=Pick<Preferences,'timezone'|'weeklyReviewEnabled'|'weeklyReviewDay'|'weeklyReviewTime'|'deadlineReminders'|'financialAlerts'|'morningBriefingEnabled'|'morningBriefingTime'|'notificationTelegramEnabled'>;
export const enabled=(kind:Kind,s:Settings)=>({weekly:s.weeklyReviewEnabled,deadline:s.deadlineReminders,financial:s.financialAlerts,morning:s.morningBriefingEnabled,reminder:true})[kind];
const formatters=new Map<string,Intl.DateTimeFormat>();
export function localClock(now:Date,timezone:string){let formatter=formatters.get(timezone);if(!formatter){if(formatters.size>=8)formatters.clear();formatter=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});formatters.set(timezone,formatter)}const parts=formatter.formatToParts(now);const get=(type:string)=>parts.find(p=>p.type===type)!.value;const date=get('year')+'-'+get('month')+'-'+get('day');return {date,time:get('hour')+':'+get('minute'),weekday:new Date(date+'T12:00:00Z').getUTCDay()};}
export function shiftDay(date:string,days:number){return new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10)}
// Catch up at most seven days; date keys collapse the repeated DST hour. A missing
// spring-forward time runs at the first real local minute after its scheduled time.
export function scheduledSlots(kind:'weekly'|'morning',settings:Settings,from:Date,to:Date,policy?:RuleSettings['weekly'],anchor=from){
 if(!enabled(kind,settings))return [];
 const slots=new Map<string,Date>(),start=Math.max(from.getTime(),to.getTime()-7*86400000);
 for(let tick=Math.floor(start/60000)*60000+60000;tick<=to.getTime();tick+=60000){const local=localClock(new Date(tick),settings.timezone),previous=localClock(new Date(tick-60000),settings.timezone),time=kind==='weekly'?settings.weeklyReviewTime:settings.morningBriefingTime;if((policy?policy.days.includes(local.weekday):(kind==='morning'||local.weekday===settings.weeklyReviewDay))&&local.time>=time&&(previous.date!==local.date||previous.time<time)&&!slots.has(local.date))slots.set(local.date,new Date(tick));}
 return [...slots].filter(([date,at])=>!policy||((!policy.startDate||date>=policy.startDate)&&policy.days.includes(localClock(at,settings.timezone).weekday)&&Math.abs(Math.floor((calendarWeek(date)-calendarWeek(policy.startDate??localClock(anchor,settings.timezone).date))/7))%policy.everyWeeks===0)).map(([date,at])=>({date,at}));
}
export const retryDelay=(attempt:number,retryAfter=0)=>Math.min(3600,Math.max(retryAfter,30*2**Math.min(7,Math.max(0,attempt-1))));
