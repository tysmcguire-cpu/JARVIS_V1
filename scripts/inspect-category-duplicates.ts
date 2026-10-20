import {PrismaClient} from '@prisma/client';
import {z} from 'zod';
process.loadEnvFile('.env');
const db=new PrismaClient();
async function main(){const owner=z.uuid().parse(process.env.JARVIS_OWNER_ID);await db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${owner},true)`;
 const verified=await tx.user.findUnique({where:{id:owner},select:{id:true}});if(!verified)throw Error('Owner unavailable');
 const duplicates=await tx.$queryRawUnsafe(`SELECT lower(regexp_replace(btrim(title),'\\s+',' ','g')) AS name,kind,count(*)::int AS count FROM "Category" WHERE "userId"=$1::uuid GROUP BY lower(regexp_replace(btrim(title),'\\s+',' ','g')),kind HAVING count(*)>1`,owner);
 const food=await tx.$queryRawUnsafe(`SELECT c.title,c.kind,(SELECT count(*)::int FROM "Transaction" t WHERE t."userId"=$1::uuid AND t."categoryId"=c.id) AS transactions,(SELECT count(*)::int FROM "BudgetCategory" b WHERE b."userId"=$1::uuid AND b."categoryId"=c.id) AS budgets FROM "Category" c WHERE c."userId"=$1::uuid AND lower(btrim(c.title))='food' ORDER BY c.kind,c.id`,owner);
 console.info(JSON.stringify({duplicates,food}));
 });}
main().catch(()=>{console.error('Read-only category inspection failed; private diagnostics suppressed.');process.exitCode=1}).finally(()=>db.$disconnect());
