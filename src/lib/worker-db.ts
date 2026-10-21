import 'server-only';
import {assertInstallation} from '@/features/commercial/installation';
import {runtimeDatabaseUrl} from '@/features/commercial/database-url';
import {PrismaClient,type Prisma} from '@prisma/client';
import {z} from 'zod';
import {assertCommercialDatabase} from '@/features/commercial/isolation';
let worker:PrismaClient|undefined;
export async function withWorkerDatabase<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){
 const url=process.env.PLUTO_WORKER_DATABASE_URL;if(!url)throw Error('Separate restricted worker credentials are not configured.');assertCommercialDatabase(url,process.env.PLUTO_SUPABASE_PROJECT_REF,true);
 if(!/^pluto_worker_runtime(?:\.|$)/.test(decodeURIComponent(new URL(url).username)))throw Error('Restricted worker login required.');worker??=new PrismaClient({datasourceUrl:runtimeDatabaseUrl(url)});return worker.$transaction(async tx=>{await assertInstallation(tx);await tx.$executeRawUnsafe("SET LOCAL TIME ZONE 'UTC'");return work(tx)},{timeout:30000});
}
export async function withWorkerCustomer<T>(input:string,work:(tx:Prisma.TransactionClient,id:string)=>Promise<T>){const id=z.uuid().parse(input);return withWorkerDatabase(async tx=>{await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${id},true)`;const [row]=await tx.$queryRawUnsafe<{status:string}[]>('SELECT status FROM "User" WHERE id=$1::uuid FOR SHARE',id);if(row?.status!=='active')throw Error('Customer unavailable.');return work(tx,id)})}
export async function closeWorkerDatabase(){await worker?.$disconnect()}
