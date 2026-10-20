'use server';
import {withOwnerRequest} from '@/features/auth/server';
import {withOwnerDatabase} from '@/lib/owner-db';
import {paletteSchema} from './appearance';
import {revalidatePath} from 'next/cache';
export async function saveAppearance(input:unknown){return withOwnerRequest(async()=>{
 const palette=paletteSchema.parse(input);
 await withOwnerDatabase(async(tx,owner)=>{
  await tx.userSettings.update({where:{userId:owner},data:palette});
  await tx.auditLog.create({data:{userId:owner,action:'settings.appearance.update',outcome:'success'}});
 });revalidatePath('/','layout');return palette;
})}
