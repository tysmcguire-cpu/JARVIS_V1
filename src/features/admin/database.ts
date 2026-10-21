import 'server-only';
import {PrismaClient,type Prisma} from '@prisma/client';
import {assertCommercialDatabase} from '@/features/commercial/isolation';
const clients=new Map<string,PrismaClient>();
export async function withAdminDatabase<T>(channel:'dashboard'|'api',work:(tx:Prisma.TransactionClient)=>Promise<T>){const key=channel==='api'?'PLUTO_ADMIN_API_DATABASE_URL':'PLUTO_ADMIN_DATABASE_URL',url=process.env[key];if(!url)throw Error('Administrator service is not configured');assertCommercialDatabase(url,process.env.PLUTO_SUPABASE_PROJECT_REF,true);const expected=channel==='api'?'pluto_admin_api_runtime':'pluto_admin_runtime';if(!new RegExp('^'+expected+'(?:\\.|$)').test(decodeURIComponent(new URL(url).username)))throw Error('Restricted administrator login required');let client=clients.get(channel);if(!client){client=new PrismaClient({datasourceUrl:url});clients.set(channel,client)}return client.$transaction(work,{timeout:15000})}
