'use server';
import { revalidatePath } from 'next/cache';
import { requireOwner,withOwnerRequest } from '@/features/auth/server';
import { entityFor } from './config';
import { readWorkspace, removeRecord, writeRecord } from './repository';
import {writeBudget,removeBudget} from './budget-repository';
export async function saveBudget(input:unknown,id?:string,version?:string){
 await requireOwner();
 try{await writeBudget(input,id,version);revalidatePath('/finances');return {ok:true,message:'Budget saved.'}}
 catch(error){return {ok:false,message:error instanceof Error&&!('code' in error)&&error.message.length<180?error.message:'Could not save budget. Check the category and limit, then try again.'}}
}
export async function loadTracking(key:string, query:unknown) { return withOwnerRequest(()=>readWorkspace(key,query)); }
export async function saveTracking(key:string,input:unknown,id?:string,updatedAt?:string) {
  await requireOwner();
  try { await writeRecord(key,input,id,updatedAt); revalidatePath('/'+entityFor(key).module);return {ok:true,message:'Record saved.'}; }
  catch(error) { const message=error instanceof Error && !('code' in error) && error.message.length<180 ? error.message : 'Could not save. Check linked records and try again.';return {ok:false,message}; }
}
export async function deleteTracking(key:string,id:string,updatedAt:string) {
  await requireOwner();
  try { if(key==='BudgetCategory')await removeBudget(id,updatedAt);else await removeRecord(key,id,updatedAt);revalidatePath('/'+entityFor(key).module);return {ok:true,message:'Record deleted.'}; }
  catch { return {ok:false,message:'Could not delete. Reload the record and remove dependent records first.'}; }
}
export async function searchLinkedChoices(key:string,field:string,search:string) {
 await requireOwner(); const {readLinkedChoices}=await import('./repository');return readLinkedChoices(key,field,search);
}
