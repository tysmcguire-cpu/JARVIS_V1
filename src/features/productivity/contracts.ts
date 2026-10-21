import {z} from 'zod';
export const widgetNames=['deadlines','tasks','schedule','spending','notifications','projects','goals','notes'] as const;
export const dashboardSchema=z.object({layout:z.enum(['default','today','custom']).default('default'),core:z.boolean().default(true),widgets:z.array(z.object({kind:z.enum(widgetNames),wide:z.boolean().default(false)})).max(6).refine(rows=>new Set(rows.map(r=>r.kind)).size===rows.length,'Choose each widget once.').refine(rows=>rows.reduce((n,w)=>n+(w.wide?2:1),0)<=6,'Maximum six widget spaces.')});
export type DashboardPreferences=z.infer<typeof dashboardSchema>;
export const defaultDashboard:DashboardPreferences={layout:'default',core:true,widgets:[{kind:'deadlines',wide:false},{kind:'tasks',wide:false},{kind:'schedule',wide:false},{kind:'spending',wide:false},{kind:'notifications',wide:false},{kind:'projects',wide:false}]};
export const stateKey=z.string().regex(/^(dashboard|calculator:[0-9a-f-]{36}|note-draft:[0-9a-f-]{36}|note-history:[0-9a-f-]{36}|links:[A-Za-z]+:[0-9a-f-]{36})$/);
export const scenarioSchema=z.object({rows:z.array(z.object({label:z.string().max(80),earned:z.string().max(30),possible:z.string().max(30),weight:z.string().max(30)})).min(1).max(20),mode:z.enum(['points','weighted']),target:z.string().max(30),finalWeight:z.string().max(30)});
export const noteDraftSchema=z.object({title:z.string().max(200),tag:z.string().max(200),content:z.string().max(32000),baseVersion:z.string().max(60)});
export const noteHistorySchema=z.array(noteDraftSchema.extend({savedAt:z.string().max(60)})).max(10);
export const linksSchema=z.array(z.object({key:z.string().max(40),id:z.uuid(),title:z.string().max(200)})).max(12);
export function validateState(key:string,input:unknown){stateKey.parse(key);return key==='dashboard'?dashboardSchema.parse(input):key.startsWith('calculator:')?scenarioSchema.parse(input):key.startsWith('note-draft:')?noteDraftSchema.parse(input):key.startsWith('note-history:')?noteHistorySchema.parse(input):linksSchema.parse(input)}
