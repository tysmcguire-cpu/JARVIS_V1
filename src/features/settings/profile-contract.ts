import {z} from 'zod';
export const optionalModules=['finances','education','calendar','career','projects','goals','notes','assistant'] as const;
export const profileSchema=z.object({displayName:z.string().trim().min(1).max(100),timezone:z.string().min(1).max(100).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true}catch{return false}}),currency:z.enum(['USD','EUR','GBP','CAD','AUD']),enabledModules:z.array(z.enum(optionalModules)).min(1).max(8).refine(v=>new Set(v).size===v.length)}).strict();
export type Profile=z.infer<typeof profileSchema>;
