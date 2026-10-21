'use server';
import {requireCustomer} from '@/features/auth/server';
import {withCustomerDatabase} from '@/lib/customer-db';
import {z} from 'zod';
import {features} from '@/features/commercial/flags';
import {csvChoices,previewImport,confirmImport} from './csv-repository';
import {integrationStatus,disconnectIntegration} from './repository';
import {revalidatePath} from 'next/cache';
function safeMessage(error:unknown){return error instanceof Error&&!('code'in error)&&!('errorCode'in error)&&error.message.length<220?error.message:'Operation unavailable. Check the data and try again.';}
export async function loadImportChoices(search=''){await requireCustomer();return csvChoices(search);}
export async function previewCsvImport(input:unknown){await requireCustomer();try{return {ok:true as const,preview:await previewImport(input)}}catch(error){return {ok:false as const,message:safeMessage(error)}}}
export async function commitCsvImport(id:string,acknowledged:boolean){await requireCustomer();try{const result=await confirmImport(id,acknowledged);revalidatePath('/finances');return {ok:true as const,...result}}catch(error){return {ok:false as const,message:safeMessage(error)}}}
export async function cancelCsvImport(id:string){await requireCustomer();z.uuid().parse(id);await withCustomerDatabase((tx,ownerId)=>tx.$executeRawUnsafe('DELETE FROM "CsvImportBatch" WHERE id=$1::uuid AND "userId"=$2::uuid AND "importedAt" IS NULL',id,ownerId));}
export async function loadIntegrations(){await requireCustomer();return integrationStatus();}
export async function disconnectConnector(id:string){await requireCustomer();return disconnectIntegration(id);}
export async function saveProviderAuthorization(input:unknown){await requireCustomer();if(!features.integrations())return {ok:false as const,message:'New integrations are disabled.'};try{const {registerConnection}=await import('./live-service');return {ok:true as const,...await registerConnection(input)}}catch(error){return {ok:false as const,message:safeMessage(error)}}}
export async function discoverAppleCalendarOptions(input:unknown){await requireCustomer();if(!features.integrations())return {ok:false as const,message:'New integrations are disabled.'};try{const {discoverOwnerAppleCalendars}=await import('./apple-discovery');return {ok:true as const,calendars:await discoverOwnerAppleCalendars(input)}}catch{return {ok:false as const,message:'Could not list iCloud calendars. Check your Apple Account email, app-specific password, permissions and discovery limit.'}}}
export async function syncProvider(id:string){await requireCustomer();const {synchronizeConnection}=await import('./live-service');try{return await synchronizeConnection(id)}catch(error){return {ok:false,count:0,message:safeMessage(error)}}}
export async function loadSourceRecords(id:string,page=1){await requireCustomer();const {sourceRecords}=await import('./repository');return sourceRecords(id,page);}
export async function resetConnectorCursor(id:string){await requireCustomer();const {resetSourceCursor}=await import('./repository');return resetSourceCursor(id);}
