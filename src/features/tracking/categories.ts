import type {Prisma} from '@prisma/client';
export const categoryName=(name:string)=>name.trim().replace(/\s+/g,' ');
export const categoryKey=(name:string)=>categoryName(name).toLowerCase();
// Shared by browser writes, inline budgets and Telegram. Serialize first-use creation.
export async function lockCategories(tx:Prisma.TransactionClient,owner:string){
 await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',owner+':categories');
}
export async function resolveCategory(tx:Prisma.TransactionClient,owner:string,name:string,kind:string){
 await lockCategories(tx,owner);
 const title=categoryName(name);
 const rows=await tx.$queryRawUnsafe<{id:string}[]>(`SELECT id FROM "Category" WHERE "userId"=$1::uuid AND lower(regexp_replace(btrim(title),'\\s+',' ','g'))=lower($2) AND kind=$3 ORDER BY id LIMIT 2`,owner,title,kind);
 if(rows.length>1)throw Error('Duplicate category names found. Rename the duplicates in Categories before saving.');
 return rows[0]?.id;
}
