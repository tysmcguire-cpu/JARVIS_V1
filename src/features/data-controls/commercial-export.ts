import 'server-only';
import type {Prisma} from '@prisma/client';
import {exportSnapshot,maxSnapshotBytes} from './snapshot';
const tables=['AiPreferences','ChatThread','ChatTurn','WeeklyReport','ResearchResult'] as const;
// Portability format only. Billing entitlements, secret grants and privileged
// account state can never be restored from a customer-supplied JSON file.
export async function commercialExport(tx:Prisma.TransactionClient,userId:string){
 const core=JSON.parse(await exportSnapshot(tx,userId));let bytes=Buffer.byteLength(JSON.stringify(core));const intelligence:Record<string,unknown[]>={};
 for(const table of tables){const [bound]=await tx.$queryRawUnsafe<{count:string;bytes:string}[]>(`SELECT count(*)::text AS count,COALESCE(sum(octet_length(to_jsonb(t)::text)),0)::text AS bytes FROM(SELECT * FROM "${table}" WHERE "userId"=$1::uuid LIMIT 5001)t`,userId);bytes+=Number(bound.bytes);if(Number(bound.count)>5000||bytes>maxSnapshotBytes-65536)throw Error('Export exceeds its safe limit. Contact support for a managed export.');const rows=await tx.$queryRawUnsafe<{row:Record<string,unknown>}[]>(`SELECT to_jsonb(t)-ARRAY['leaseToken','leaseUntil']::text[] AS row FROM "${table}" t WHERE "userId"=$1::uuid ORDER BY ${table==='AiPreferences'?'"userId"':'id'}`,userId);intelligence[table]=rows.map(r=>r.row);}
 const text=JSON.stringify({...core,format:'pluto-portability-v2',intelligence});if(Buffer.byteLength(text)>maxSnapshotBytes)throw Error('Export exceeds its safe limit.');return text;
}
