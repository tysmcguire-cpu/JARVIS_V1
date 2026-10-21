import {z} from 'zod';
export const intelligenceDomains=['finances','education','calendar','career','projects','goals','notes','sources'] as const;
export const aiPreferencesSchema=z.object({sharingEnabled:z.boolean(),allowedDomains:z.array(z.enum(intelligenceDomains)).max(8).refine(v=>new Set(v).size===v.length),weeklyEnabled:z.boolean(),reportDay:z.number().int().min(0).max(6),reportTime:z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),telegramReports:z.boolean()}).strict().refine(v=>!v.weeklyEnabled||(v.sharingEnabled&&v.allowedDomains.length>0),'Weekly reports require sharing consent and selected domains.');
export type AiPreferences=z.infer<typeof aiPreferencesSchema>;
export const defaultAiPreferences:AiPreferences={sharingEnabled:false,allowedDomains:[],weeklyEnabled:false,reportDay:0,reportTime:'18:00',telegramReports:false};
export const chatInputSchema=z.object({requestId:z.uuid(),threadId:z.uuid().optional(),question:z.string().trim().min(1).max(1000),domains:z.array(z.enum(intelligenceDomains)).min(1).max(8).refine(v=>new Set(v).size===v.length),recommendations:z.boolean().default(false)}).strict();
export const selectionSchema=z.object({factIndices:z.array(z.number().int().nonnegative()).max(24),insights:z.array(z.object({kind:z.enum(['estimate','recommendation']),text:z.string().min(1).max(500),factIndices:z.array(z.number().int().nonnegative()).min(1).max(5)}).strict()).max(5)}).strict();
export type Selection=z.infer<typeof selectionSchema>;
