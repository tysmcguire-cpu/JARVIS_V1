import {z} from 'zod';
import type {SourceRecord} from './contract';
const sourceSchema=z.object({externalId:z.string().min(1).max(200),kind:z.enum(['Event','Note','Project','Assignment']),sourceUrl:z.url().max(500).refine(v=>v.startsWith('https://')),sourceUpdatedAt:z.iso.datetime().transform(value=>new Date(value).toISOString()),data:z.record(z.string().max(80),z.string().max(8000)),deleted:z.boolean().optional()}).strict();
export function validateSource(value:unknown):SourceRecord {const result=sourceSchema.parse(value);if(Object.keys(result.data).length>20||!result.data.title?.trim())throw Error('Invalid normalized provider data.');return result;}
