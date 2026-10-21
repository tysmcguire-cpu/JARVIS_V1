import {z} from 'zod';
import {entities} from '@/features/tracking/config';
import type {Prisma} from '@prisma/client';
import {answerSchema,validAnswer} from '@/features/assistant/contract';
import {defaultRuleSettings,ruleSettingsSchema,type Kind} from '@/features/notifications/rules';
export const snapshotTables=['User','UserSettings','WorkspaceState','FinancialAccount','Category','CsvImportBatch','CsvImportKey',...entities.filter(e=>!['FinancialAccount','Category'].includes(e.key)).map(e=>e.key),'ApiConnection','ExternalRecord','SyncLog','TelegramIdentity','TelegramMessage','AiConversation','AiSourceReference','NotificationRule','NotificationJob','NotificationDelivery','AuditLog'] as const;
export const maxSnapshotBytes=16*1024*1024;
const excluded:Record<string,string[]>={ApiConnection:['tokenCiphertext','cursor','leaseToken','leaseUntil'],TelegramIdentity:['pairingHash','pairingExpiresAt'],TelegramMessage:['leaseToken','leaseUntil'],NotificationJob:['leaseToken','leaseUntil']};
export const snapshotSchema=z.object({format:z.literal('pluto-data-v1'),ownerId:z.uuid(),exportedAt:z.iso.datetime(),tables:z.record(z.string(),z.array(z.record(z.string(),z.unknown())).max(5000))}).strict();
export type Snapshot=z.infer<typeof snapshotSchema>;
type Tx=Pick<Prisma.TransactionClient,'$queryRawUnsafe'|'$executeRawUnsafe'>;
export async function exportSnapshot(tx:Tx,owner:string){
 // Bound each table before constructing a single JSON aggregate. Counting row
 // JSON overestimates the final size because credential fields are removed.
 let size=0;
 for(const table of snapshotTables){const [bound]=await tx.$queryRawUnsafe<{count:string;bytes:string}[]>(`SELECT count(*)::text AS count,COALESCE(sum(octet_length(to_jsonb(t)::text)),0)::text AS bytes FROM(SELECT * FROM "${table}" WHERE ${table==='User'?'id':'"userId"'}=$1::uuid LIMIT 5001)t`,owner);if(Number(bound.count)>5000)throw Error('Export exceeds 5,000 records per table.');size+=Number(bound.bytes);if(size>maxSnapshotBytes-65536)throw Error('Export exceeds 16 MiB. Use an approved native database backup.');}
 const pairs:string[]=[];
 for(const table of snapshotTables){const removals=excluded[table]??[],money=entities.find(e=>e.key===table)?.fields.filter(f=>f.type==='money').map(f=>f.name)??(table==='NotificationRule'?['thresholdMinor']:table==='TelegramMessage'?['updateId']:[]);
 const value=`to_jsonb(t)${removals.length?' - ARRAY['+removals.map(s=>"'"+s+"'").join(',')+']::text[]':''}${money.length?' || jsonb_build_object('+money.flatMap(f=>["'"+f+"'",'t."'+f+'"::text']).join(',')+')':''}`;
 pairs.push(`'${table}'`,`(SELECT COALESCE(jsonb_agg(${value}),'[]'::jsonb) FROM(SELECT * FROM "${table}" WHERE ${table==='User'?'id':'"userId"'}=$1::uuid ORDER BY ${['UserSettings','TelegramIdentity'].includes(table)?'"userId"':'id'} LIMIT 5001)t)`);
 }
 const [{snapshot}]=await tx.$queryRawUnsafe<{snapshot:string}[]>(`SELECT jsonb_build_object('format','pluto-data-v1','ownerId',$1::text,'exportedAt',to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'tables',jsonb_build_object(${pairs.join(',')}))::text AS snapshot`,owner);
 if(Buffer.byteLength(snapshot,'utf8')>maxSnapshotBytes)throw Error('Export exceeds 16 MiB. Use an approved native database backup.');parseSnapshot(snapshot,owner);return snapshot;
}
export function parseSnapshot(text:string,owner:string){if(Buffer.byteLength(text,'utf8')>maxSnapshotBytes)throw Error('Snapshot too large');const snapshot=snapshotSchema.parse(JSON.parse(text));snapshot.tables.WorkspaceState??=[];if(snapshot.ownerId!==owner)throw Error('Snapshot owner mismatch');if(snapshotTables.some(t=>!Array.isArray(snapshot.tables[t]))||Object.keys(snapshot.tables).some(t=>!snapshotTables.includes(t as typeof snapshotTables[number])))throw Error('Snapshot table mismatch');
 for(const table of snapshotTables)for(const row of snapshot.tables[table]){if((table==='User'?row.id:row.userId)!==owner)throw Error('Snapshot row owner mismatch');if((excluded[table]??[]).some(f=>f in row))throw Error('Snapshot contains excluded credentials');}
 for(const row of snapshot.tables.NotificationJob)z.object({title:z.string().max(300),text:z.string().max(1200),href:z.enum(['/assistant','/education','/calendar','/projects','/career','/finances']),asOf:z.iso.datetime(),sourceUpdatedAt:z.iso.datetime(),coverage:z.string().max(1000)}).strict().parse(row.payload);
 for(const row of snapshot.tables.NotificationRule){const kind=z.enum(['weekly','deadline','financial','morning','reminder']).parse(row.kind) as Kind;ruleSettingsSchema.shape[kind].parse({...defaultRuleSettings({weeklyReviewDay:0,deadlineReminders:true})[kind],...(z.record(z.string(),z.unknown()).parse(row.config??{}))});}
 for(const row of snapshot.tables.AiConversation)if(row.status==='complete')validAnswer(answerSchema.parse(row.answer));
 for(const row of snapshot.tables.ExternalRecord)z.string().url().startsWith('https://').parse(row.sourceUrl);
 if(snapshot.tables.User.length!==1||snapshot.tables.UserSettings.length>1)throw Error('Snapshot identity mismatch');return snapshot;
}
// CLI-only restore, never a model tool or server action. The caller must stop
// workers and explicitly approve replacement; the transaction supplies rollback.
export async function restoreSnapshot(tx:Tx,owner:string,snapshot:Snapshot){parseSnapshot(JSON.stringify(snapshot),owner);await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',owner+':notifications');const bank=await tx.$queryRawUnsafe<{id:string}[]>("SELECT id FROM \"ApiConnection\" WHERE \"userId\"=$1::uuid AND provider='plaid' AND \"tokenCiphertext\" IS NOT NULL LIMIT 1 FOR UPDATE",owner);if(bank.length)throw Error('Disconnect and revoke the bank connection before replacing app data.');await tx.$executeRawUnsafe('DELETE FROM "User" WHERE id=$1::uuid',owner);
 for(const table of snapshotTables){const rows=snapshot.tables[table].map(row=>{const result={...row};if(table==='UserSettings'){result.notificationTelegramEnabled=false;result.clockFormat??='24h';result.wordmarkStyle??='original';result.tertiaryColor??='#87a8bc';result.background??='current';result.primaryColor??='#69d8f3';result.secondaryColor??='#b1a0ff';}if(table==='ApiConnection'){result.status='disconnected';result.retryAt=null;if(row.provider==='plaid')result.selection={...(row.selection as object??{}),connected:false,automaticSync:false,completedSession:undefined};}if(table==='TelegramIdentity')result.pairedAt=null;if(table==='TelegramMessage'&&!result.deliveredAt)result.canceledAt=new Date().toISOString();if(table==='NotificationRule'){result.config??={};result.lastScannedAt=new Date().toISOString();result.version=Number(result.version)+1;}if(table==='NotificationJob')result.status='canceled';return result});if(!rows.length)continue;
 await tx.$executeRawUnsafe(`INSERT INTO "${table}" SELECT * FROM jsonb_populate_recordset(null::"${table}",$1::jsonb)`,JSON.stringify(rows));
 }
}
