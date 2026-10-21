'use server';
import {withCustomerRequest} from '@/features/auth/server';
import {withCustomerDatabase} from '@/lib/customer-db';
import {paletteSchema} from './appearance';
import {revalidatePath} from 'next/cache';
export async function saveAppearance(input:unknown){return withCustomerRequest(async()=>{
 const palette=paletteSchema.parse(input);
 await withCustomerDatabase(async(tx,owner)=>{
  await tx.userSettings.update({where:{userId:owner},data:palette});
  await tx.auditLog.create({data:{userId:owner,action:'settings.appearance.update',outcome:'success'}});
 });revalidatePath('/','layout');return palette;
})}
