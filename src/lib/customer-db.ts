import 'server-only';
import {redirect} from 'next/navigation';
import type {Prisma} from '@prisma/client';
import {db} from '@/lib/db';
import {requireCustomer} from '@/features/auth/server';
export async function withCustomerDatabase<T>(query:(tx:Prisma.TransactionClient,userId:string)=>Promise<T>):Promise<T>{
 const customer=await requireCustomer();
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub', ${customer.id}, true)`;
  const rows=await tx.$queryRawUnsafe<{status:string}[]>('SELECT status FROM "User" WHERE id=$1::uuid FOR SHARE',customer.id);
  if(!rows.length)redirect('/onboarding');
  if(rows[0].status!=='active')throw Error('This account is unavailable.');
  return query(tx,customer.id);
 },{timeout:15000});
}
