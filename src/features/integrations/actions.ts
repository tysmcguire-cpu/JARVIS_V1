'use server';
import {requireOwner} from '@/features/auth/server';
import {withOwnerDatabase} from '@/lib/owner-db';
import {z} from 'zod';
import {csvChoices,previewImport,confirmImport} from './csv-repository';
import {integrationStatus,disconnectIntegration} from './repository';
import {revalidatePath} from 'next/cache';
function safeMessage(error:unknown){return error instanceof Error&&!('code'in error)&&!('errorCode'in error)&&error.message.length<220?error.message:'Operation unavailable. Check the data and try again.';}
export async function loadImportChoices(search=''){await requireOwner();return csvChoices(search);}
export async function previewCsvImport(input:unknown){await requireOwner();try{return {ok:true as const,preview:await previewImport(input)}}catch(error){return {ok:false as const,message:safeMessage(error)}}}
export async function commitCsvImport(id:string,acknowledged:boolean){await requireOwner();try{const result=await confirmImport(id,acknowledged);revalidatePath('/finances');return {ok:true as const,...result}}catch(error){return {ok:false as const,message:safeMessage(error)}}}
export async function cancelCsvImport(id:string){await requireOwner();z.uuid().parse(id);await withOwnerDatabase((tx,ownerId)=>tx.$executeRawUnsafe('DELETE FROM "CsvImportBatch" WHERE id=$1::uuid AND "userId"=$2::uuid AND "importedAt" IS NULL',id,ownerId));}
export async function loadIntegrations(){await requireOwner();return integrationStatus();}
export async function disconnectConnector(id:string){await requireOwner();return disconnectIntegration(id);}
export async function saveProviderAuthorization(input:unknown){await requireOwner();try{const {registerConnection}=await import('./live-service');return {ok:true as const,...await registerConnection(input)}}catch(error){return {ok:false as const,message:safeMessage(error)}}}
export async function syncProvider(id:string){await requireOwner();const {synchronizeConnection}=await import('./live-service');try{return await synchronizeConnection(id)}catch(error){return {ok:false,count:0,message:safeMessage(error)}}}
export async function loadSourceRecords(id:string,page=1){await requireOwner();const {sourceRecords}=await import('./repository');return sourceRecords(id,page);}
export async function resetConnectorCursor(id:string){await requireOwner();const {resetSourceCursor}=await import('./repository');return resetSourceCursor(id);}
