import {z} from 'zod';

const days=z.array(z.number().int().min(0).max(6)).min(1,'Choose at least one day.').max(7).refine(v=>new Set(v).size===v.length,'Choose each day once.');
const calendar=z.object({telegram:z.boolean(),days,everyWeeks:z.number().int().min(1).max(12),startDate:z.iso.date().optional()}).strict();
const repeat={telegram:z.boolean(),repeat:z.enum(['once','daily','interval']),intervalHours:z.number().int().min(1).max(168)};
export const deadlineEntities=['Task','Assignment','Exam','Milestone','FollowUp'] as const;
export const ruleSettingsSchema=z.object({
  weekly:calendar,
  morning:calendar,
  deadline:z.object({...repeat,entities:z.array(z.enum(deadlineEntities)).min(1,'Choose at least one deadline source.').max(5).refine(v=>new Set(v).size===v.length)}).strict(),
  financial:z.object({...repeat,time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)}).strict(),
  reminder:z.object({...repeat,enabled:z.boolean()}).strict(),
}).strict();
export type RuleSettings=z.infer<typeof ruleSettingsSchema>;
export type Kind=keyof RuleSettings;
type Defaults={weeklyReviewDay:number;deadlineReminders:boolean};
export function defaultRuleSettings(s:Defaults):RuleSettings {
  const once={telegram:true,repeat:'once' as const,intervalHours:24};
  return {weekly:{telegram:true,days:[s.weeklyReviewDay],everyWeeks:1},morning:{telegram:true,days:[0,1,2,3,4,5,6],everyWeeks:1},deadline:{...once,entities:[...deadlineEntities]},financial:{...once,time:'00:00'},reminder:{...once,enabled:s.deadlineReminders}};
}
export function storedRuleSettings(s:Defaults,rows:{kind:string;config?:unknown}[]):RuleSettings {
  const defaults=defaultRuleSettings(s);
  return ruleSettingsSchema.parse(Object.fromEntries(Object.entries(defaults).map(([kind,value])=>[kind,{...value,...(rows.find(r=>r.kind===kind)?.config as object??{})}])));
}
export function repetitionKey(policy:{repeat:'once'|'daily'|'interval';intervalHours:number},date:string,time:string,anchorDate:string,anchorTime='00:00') {
  if(policy.repeat==='once')return 'once';
  if(policy.repeat==='daily')return date;
  // Intervals are measured in local wall-clock hours; a repeated DST hour shares a key.
  const elapsed=Date.parse(`${date}T${time}:00Z`)-Date.parse(`${anchorDate}T${anchorTime}:00Z`);
  return 'interval:'+Math.floor(Math.max(0,elapsed)/(policy.intervalHours*3600000));
}
export function calendarWeek(date:string){const day=new Date(date+'T12:00:00Z').getUTCDay();return Math.floor(Date.parse(date+'T12:00:00Z')/86400000)-day;}
