import 'server-only';
import {PrismaClient} from '@prisma/client';
import {assertCommercialDatabase} from '@/features/commercial/isolation';
import {runtimeDatabaseUrl} from '@/features/commercial/database-url';
if(process.env.DATABASE_URL)assertCommercialDatabase(process.env.DATABASE_URL);
const globalDb=globalThis as unknown as {plutoPrisma?:PrismaClient};
export const db=globalDb.plutoPrisma??new PrismaClient({datasourceUrl:process.env.DATABASE_URL?runtimeDatabaseUrl(process.env.DATABASE_URL,3):undefined});
if(process.env.NODE_ENV!=='production')globalDb.plutoPrisma=db;
