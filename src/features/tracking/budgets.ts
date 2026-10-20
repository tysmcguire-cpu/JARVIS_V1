import {z} from 'zod';
import {parseMoney} from './config';
import {categoryName} from './categories';
export function budgetInput(input:unknown){
 const value=z.object({title:z.string().trim().min(1).max(200),category:z.string().trim().min(1).max(200),limit:z.string(),month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),currency:z.enum(['USD','CAD','EUR','GBP'])}).parse(input);
 const limit=parseMoney(value.limit);if(limit<0n)throw Error('Limit must be a nonnegative amount.');
 const end=new Date(Date.UTC(Number(value.month.slice(0,4)),Number(value.month.slice(5)),0)).toISOString().slice(0,10);
 return {...value,category:categoryName(value.category),limit,startDate:value.month+'-01',endDate:end};
}
