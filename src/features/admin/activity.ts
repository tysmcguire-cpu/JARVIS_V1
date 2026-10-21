'use server';
import {z} from 'zod';
import {withCustomerDatabase} from '@/lib/customer-db';
export async function recordActivity(input:unknown){const feature=z.enum(['dashboard','finances','education','calendar','career','projects','goals','notes','assistant','notifications','settings']).parse(input);await withCustomerDatabase(tx=>tx.$queryRawUnsafe('SELECT public.pluto_record_activity($1)',feature))}
