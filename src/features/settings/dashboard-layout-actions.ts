'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {readPersonalState,savePersonalState} from '@/features/productivity/state-actions';
import {dashboardSchema,defaultDashboard} from '@/features/productivity/contracts';
export async function saveDashboardLayout(input:unknown){
 const layout=z.enum(['default','custom']).parse(input);
 const current=await readPersonalState('dashboard');
 const parsed=dashboardSchema.safeParse(current.value);
 if(current.value!==null&&!parsed.success)throw Error('Saved dashboard could not be read.');
 await savePersonalState('dashboard',{...(parsed.success?parsed.data:defaultDashboard),layout},current.version);
 revalidatePath('/','page');
}
