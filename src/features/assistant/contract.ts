import {z} from 'zod';
export const domains=['finances','education','calendar','career','projects','goals','notes','sources','weekly'] as const;
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>Number(s.slice(0,4))>0&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s,'Use a real date');
export const querySchema=z.object({domain:z.enum(domains),search:z.string().trim().max(100),start:date,end:date,view:z.enum(['summary','conflicts']),recommendations:z.boolean()}).strict().refine(q=>q.start<=q.end&&Date.parse(q.end)-Date.parse(q.start)<=366*86400000,'Choose a date window of at most 366 days');
export const askSchema=z.object({question:z.string().trim().min(1).max(1000),query:querySchema,interpret:z.boolean(),consent:z.boolean()}).strict();
export type Query=z.infer<typeof querySchema>;
export type Source={id:string;label:string;href:string;updatedAt:string;fetchedAt:string;origin:'manual'|'imported'|'aggregate';detail:string};
export type Claim={kind:'fact'|'calculation'|'estimate'|'recommendation';text:string;sourceIds:string[]};
export type Answer={claims:Claim[];sources:Source[];asOf:string;limitations:string[];engine:string};
export type Entry={id:string;question:string;answer:Answer;createdAt:string};
export function validAnswer(answer:Answer){const ids=new Set(answer.sources.map(s=>s.id));if(answer.claims.some(c=>!c.sourceIds.length||c.sourceIds.some(id=>!ids.has(id))))throw Error('Unsupported source reference');return answer;}
