import { z } from 'zod';
import { currencies, entityFor, parseMoney } from './config';
export function validateRecord(key: string, input: unknown): Record<string, string | number | bigint> {
  const entity = entityFor(key); const source = z.record(z.string(), z.string().max(8000)).parse(input);
  const result: Record<string, string | number | bigint> = {};
  for (const field of entity.fields) {
    const value = (source[field.name] ?? '').trim();
    try {
      if (field.type === 'money') { const amount = parseMoney(value); if (field.name !== 'openingBalance' && amount < 0n) throw Error(); result[field.name] = amount; }
      else if (field.type === 'number') { if (!/^\d+$/.test(value)) throw Error(); result[field.name] = z.number().int().min(0).max(field.max ?? 1000000).parse(Number(value)); }
      else if (field.type === 'date') { z.iso.date().parse(value); if (new Date(value).toISOString().slice(0,10) !== value) throw Error(); result[field.name] = value; }
      else if (field.type === 'time') result[field.name] = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).parse(value);
      else if (field.type === 'relation') result[field.name] = z.uuid().parse(value);
      else if (field.type === 'currency') { if (!currencies.includes(value)) throw Error(); result[field.name] = value; }
      else if (field.type === 'select') { if (!field.options?.includes(value)) throw Error(); result[field.name] = value; }
      else if (field.type === 'url') { if (value && !['https:', 'http:'].includes(new URL(value).protocol)) throw Error(); result[field.name] = z.string().max(200).parse(value); }
      else if (field.type === 'email') result[field.name] = value ? z.email().max(200).parse(value) : '';
      else result[field.name] = z.string().min(['description','instructor','location','content','tag'].includes(field.name) ? 0 : 1).max(field.type === 'longtext' ? 8000 : 200).parse(value);
    } catch { throw new Error(`${field.label}: enter a valid ${field.type === 'money' ? 'nonnegative amount with at most two decimal places' : field.type === 'relation' ? 'linked record' : 'value'}.`); }
  }
  if (result.endDate && result.startDate && result.endDate < result.startDate) throw Error('End date must be on or after the start date.');
  if (key === 'Event' && result.startDate === result.endDate && result.endTime < result.startTime) throw Error('End time must be on or after the start time.');
  if (key === 'Grade' && Number(result.pointsPossible) === 0) throw Error('Points possible must be greater than zero.');
  if (['Goal','Habit'].includes(key) && Number(result.target) === 0) throw Error('Target must be greater than zero.');
  return result;
}
export const recordId = z.uuid();
export function readQuery(input: unknown) {
  return z.object({ page: z.number().int().min(1).max(100000).default(1), search: z.string().max(100).default(''), status: z.string().max(100).default(''), sort: z.enum(['updatedAt','title','date']).default('updatedAt'), direction: z.enum(['asc','desc']).default('desc'), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).default(new Date().toISOString().slice(0,7)) }).strict().parse(input);
}
