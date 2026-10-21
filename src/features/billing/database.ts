import 'server-only';
import {PrismaClient,type Prisma} from '@prisma/client';
import {assertCommercialDatabase} from '@/features/commercial/isolation';
let billing:PrismaClient|undefined;
export async function withBillingDatabase<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){
 const url=process.env.PLUTO_BILLING_DATABASE_URL;if(!url)throw Error('Separate restricted billing database credentials are not configured.');
 assertCommercialDatabase(url,process.env.PLUTO_SUPABASE_PROJECT_REF,true);
 if(!/^pluto_billing_runtime(?:\.|$)/.test(decodeURIComponent(new URL(url).username)))throw Error('Restricted billing runtime login required.');
 billing??=new PrismaClient({datasourceUrl:url});return billing.$transaction(work,{timeout:30000});
}
