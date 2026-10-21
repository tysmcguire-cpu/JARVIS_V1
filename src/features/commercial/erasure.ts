import 'server-only';
import {assertInstallation} from '@/features/commercial/installation';
import {runtimeDatabaseUrl} from '@/features/commercial/database-url';
import {PrismaClient,type Prisma} from '@prisma/client';
import {assertCommercialDatabase} from './isolation';
let client:PrismaClient|undefined;
export async function withErasureDatabase<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){const url=process.env.PLUTO_ERASURE_DATABASE_URL;if(!url)throw Error('Erasure runtime not configured');assertCommercialDatabase(url,process.env.PLUTO_SUPABASE_PROJECT_REF,true);if(!/^pluto_erasure_runtime(?:\.|$)/.test(decodeURIComponent(new URL(url).username)))throw Error('Restricted erasure runtime required');client??=new PrismaClient({datasourceUrl:runtimeDatabaseUrl(url)});return client.$transaction(async tx=>{await assertInstallation(tx);await tx.$executeRawUnsafe("SET LOCAL TIME ZONE 'UTC'");return work(tx)},{timeout:15000})}
export async function eraseAuthAccounts(fetcher:typeof fetch=fetch,run=withErasureDatabase){
 if(process.env.PLUTO_AUTH_ERASURE_ENABLED!=='true')return 0;const ref=process.env.PLUTO_SUPABASE_PROJECT_REF,key=process.env.PLUTO_AUTH_ERASURE_KEY;if(!ref||!/^[-a-z0-9]{10,40}$/.test(ref)||!key)throw Error('Separate commercial erasure configuration required');
 const rows=await run(tx=>tx.$queryRawUnsafe<{userId:string;token:string}[]>('SELECT * FROM public.pluto_claim_erasure()'));
 for(const row of rows){const response=await fetcher(`https://${ref}.supabase.co/auth/v1/admin/users/${row.userId}`,{method:'DELETE',headers:{apikey:key,Authorization:'Bearer '+key},redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok&&response.status!==404)throw Error('Authentication erasure unavailable');await run(tx=>tx.$queryRawUnsafe('SELECT public.pluto_complete_erasure($1::uuid,$2::uuid)',row.userId,row.token));}return rows.length;
}
export async function closeErasureDatabase(){await client?.$disconnect()}
