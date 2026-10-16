import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {withOwnerDatabase} from '@/lib/owner-db';
import {formatMoney} from '@/features/tracking/config';
import {normalizeCsv,mappingSchema,type CsvRow} from './csv';
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const uuid=z.uuid();
export type ImportPreview={id:string;filename:string;currency:string;accountTitle:string;rows:CsvRow[];income:string;expense:string;alreadyImported:number;possibleDuplicates:number;imported:boolean};
const requestSchema=z.object({text:z.string().max(262144),filename:z.string().max(500),accountId:uuid,expenseCategoryId:z.union([uuid,z.literal('')]),incomeCategoryId:z.union([uuid,z.literal('')]),mapping:mappingSchema}).strict();
export type ImportRequest=z.infer<typeof requestSchema>;
export async function csvChoices(search=''){
 z.string().max(100).parse(search);return withOwnerDatabase(async(tx,ownerId)=>{
 const pattern=`%${search.replace(/[\\%_]/g,'\\$&')}%`;const accounts=await tx.$queryRawUnsafe<{id:string;title:string;currency:string}[]>('SELECT id,title,currency FROM "FinancialAccount" WHERE "userId"=$1::uuid AND title ILIKE $2 ORDER BY title,id LIMIT 100',ownerId,pattern);const categories=await tx.$queryRawUnsafe<{id:string;title:string;kind:string}[]>('SELECT id,title,kind FROM "Category" WHERE "userId"=$1::uuid AND title ILIKE $2 ORDER BY title,id LIMIT 100',ownerId,pattern);return {accounts,categories};
 });
}
export async function previewImport(input:unknown):Promise<ImportPreview>{
 const request=requestSchema.parse(input);
 return withOwnerDatabase(async(tx,ownerId)=>{
 await tx.$executeRawUnsafe('DELETE FROM "CsvImportBatch" WHERE "userId"=$1::uuid AND "importedAt" IS NULL AND "expiresAt"<now()',ownerId);
 const accounts=await tx.$queryRawUnsafe<{currency:string;title:string}[]>('SELECT title,currency FROM "FinancialAccount" WHERE id=$1::uuid AND "userId"=$2::uuid FOR SHARE',request.accountId,ownerId);if(!accounts[0])throw Error('Select an existing owner account first.');const currency=accounts[0].currency;
 const rows=normalizeCsv(request.text,request.mapping,currency);const categories=await tx.$queryRawUnsafe<{id:string;kind:string}[]>('SELECT id,kind FROM "Category" WHERE "userId"=$1::uuid AND (id=$2::uuid OR id=$3::uuid)',ownerId,request.expenseCategoryId||null,request.incomeCategoryId||null);
 for(const row of rows){const id=row.kind==='expense'?request.expenseCategoryId:request.incomeCategoryId;if(!categories.some(c=>c.id===id&&c.kind===row.kind))throw Error(`Select an existing ${row.kind} category for these transactions.`);row.categoryId=id;}
 const digest=hash([request.accountId,currency,rows.map(r=>[r.date,r.title,r.amount,r.kind,r.externalId,r.categoryId])]);
 for(const [index,row] of rows.entries()){row.externalKey=hash(row.externalId?['bank-id',row.externalId]:['file-row',digest,index]);row.payloadHash=hash([row.date,row.title,row.amount,row.kind,currency]);}
 const known=await tx.$queryRawUnsafe<{externalKey:string;payloadHash:string}[]>('SELECT "externalKey","payloadHash" FROM "CsvImportKey" WHERE "userId"=$1::uuid AND "accountId"=$2::uuid AND "externalKey" IN(SELECT jsonb_array_elements_text($3::jsonb))',ownerId,request.accountId,JSON.stringify(rows.map(r=>r.externalKey)));
 const existingDuplicates=await tx.$queryRawUnsafe<{number:number}[]>(`SELECT DISTINCT incoming.number FROM jsonb_to_recordset($3::jsonb) AS incoming(number int,date text,title text,amount text,kind text) JOIN "Transaction" t ON t."userId"=$1::uuid AND t."accountId"=$2::uuid AND t.date=incoming.date::date AND t.title=incoming.title AND t.amount=incoming.amount::bigint JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" AND c.kind=incoming.kind`,ownerId,request.accountId,JSON.stringify(rows));
 const fingerprints=new Map<string,number>();for(const row of rows)fingerprints.set(row.payloadHash!,1+(fingerprints.get(row.payloadHash!)??0));
 for(const row of rows){const prior=known.find(k=>k.externalKey===row.externalKey);if(prior&&prior.payloadHash!==row.payloadHash)throw Error(`CSV record ${row.number} reuses an imported bank ID with changed contents. Resolve it manually; no import was performed.`);row.alreadyImported=!!prior;row.possibleDuplicate=!prior&&(existingDuplicates.some(d=>d.number===row.number)||(!row.externalId&&(fingerprints.get(row.payloadHash!)??0)>1));}
 const filename=request.filename.replace(/^.*[\\/]/,'').replace(/[\x00-\x1f]/g,'').slice(0,120)||'transactions.csv';
 const prior=await tx.$queryRawUnsafe<{id:string;importedAt:Date|null}[]>('SELECT id,"importedAt" FROM "CsvImportBatch" WHERE "userId"=$1::uuid AND "accountId"=$2::uuid AND digest=$3',ownerId,request.accountId,digest);const id=prior[0]?.id??randomUUID();const possibleDuplicates=rows.filter(r=>r.possibleDuplicate).length;
 if(!prior[0]?.importedAt)await tx.$executeRawUnsafe('INSERT INTO "CsvImportBatch"(id,"userId","accountId",digest,filename,currency,plan,"rowCount","duplicateCount","expiresAt")VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7::jsonb,$8,$9,now()+interval \'30 minutes\') ON CONFLICT("userId","accountId",digest) DO UPDATE SET plan=EXCLUDED.plan,"duplicateCount"=EXCLUDED."duplicateCount","expiresAt"=EXCLUDED."expiresAt"',id,ownerId,request.accountId,digest,filename,currency,JSON.stringify(rows),rows.length,possibleDuplicates);
 const saved=await tx.$queryRawUnsafe<{id:string;importedAt:Date|null}[]>('SELECT id,"importedAt" FROM "CsvImportBatch" WHERE "userId"=$1::uuid AND "accountId"=$2::uuid AND digest=$3',ownerId,request.accountId,digest);
 const sum=(kind:string)=>rows.filter(r=>r.kind===kind).reduce((n,r)=>n+BigInt(r.amount),0n);
 return {id:saved[0].id,filename,currency,accountTitle:accounts[0].title,rows,income:formatMoney(sum('income'),currency),expense:formatMoney(sum('expense'),currency),alreadyImported:rows.filter(r=>r.alreadyImported).length,possibleDuplicates,imported:!!saved[0].importedAt};
 });
}
export async function confirmImport(batchId:string,acknowledgeDuplicates:boolean){
 uuid.parse(batchId);z.boolean().parse(acknowledgeDuplicates);
 return withOwnerDatabase(async(tx,ownerId)=>{
 await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text',ownerId+':csv');
 const batches=await tx.$queryRawUnsafe<{accountId:string;currency:string;plan:CsvRow[];importedAt:Date|null;importedCount:number;skippedCount:number;valid:boolean}[]>('SELECT "accountId",currency,plan,"importedAt","importedCount","skippedCount","expiresAt">now() AS valid FROM "CsvImportBatch" WHERE id=$1::uuid AND "userId"=$2::uuid FOR UPDATE',batchId,ownerId);const batch=batches[0];if(!batch)throw Error('Import preview is unavailable.');if(batch.importedAt)return {inserted:batch.importedCount,skipped:batch.skippedCount,repeated:true};if(!batch.valid)throw Error('Import preview expired. Upload and review the file again.');
 const account=await tx.$queryRawUnsafe<{currency:string}[]>('SELECT currency FROM "FinancialAccount" WHERE id=$1::uuid AND "userId"=$2::uuid FOR UPDATE',batch.accountId,ownerId);if(account[0]?.currency!==batch.currency)throw Error('Account currency changed. Create a new preview.');
 const categories=await tx.$queryRawUnsafe<{id:string;kind:string}[]>('SELECT id,kind FROM "Category" WHERE "userId"=$1::uuid FOR SHARE',ownerId);const rows=batch.plan;if(!Array.isArray(rows)||rows.length<1||rows.length>200)throw Error('Invalid saved import plan.');for(const row of rows)if(!categories.some(c=>c.id===row.categoryId&&c.kind===row.kind))throw Error('A selected category changed or was removed. Create a new preview.');
 // Recheck duplicates and immutable bank IDs at confirmation, not just at preview time.
 const keys=await tx.$queryRawUnsafe<{externalKey:string;payloadHash:string}[]>('SELECT "externalKey","payloadHash" FROM "CsvImportKey" WHERE "userId"=$1::uuid AND "accountId"=$2::uuid AND "externalKey" IN(SELECT jsonb_array_elements_text($3::jsonb))',ownerId,batch.accountId,JSON.stringify(rows.map(r=>r.externalKey)));
 for(const row of rows){const prior=keys.find(k=>k.externalKey===row.externalKey);if(prior&&prior.payloadHash!==row.payloadHash)throw Error('A bank transaction ID conflicts with an earlier import. Nothing was imported.');}
 const matches=await tx.$queryRawUnsafe<{number:number}[]>(`SELECT DISTINCT incoming.number FROM jsonb_to_recordset($3::jsonb) AS incoming(number int,date text,title text,amount text,kind text) JOIN "Transaction" t ON t."userId"=$1::uuid AND t."accountId"=$2::uuid AND t.date=incoming.date::date AND t.title=incoming.title AND t.amount=incoming.amount::bigint JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" AND c.kind=incoming.kind`,ownerId,batch.accountId,JSON.stringify(rows));
 const newlyMatched=rows.some(r=>!r.possibleDuplicate&&!keys.some(k=>k.externalKey===r.externalKey)&&matches.some(m=>m.number===r.number));if(newlyMatched)throw Error('New possible duplicates appeared since preview. Create a fresh preview and review them.');
 const possible=rows.some(r=>!keys.some(k=>k.externalKey===r.externalKey)&&(r.possibleDuplicate||matches.some(m=>m.number===r.number)));if(possible&&!acknowledgeDuplicates)throw Error('Review and acknowledge possible duplicates before importing.');
 const incoming=rows.map(r=>({...r,id:randomUUID(),keyId:randomUUID()}));
 const result=await tx.$queryRawUnsafe<{inserted:bigint}[]>(`WITH incoming AS (SELECT * FROM jsonb_to_recordset($4::jsonb) AS r(id uuid,"keyId" uuid,date text,title text,amount text,"categoryId" uuid,"externalKey" text,"payloadHash" text)), new_keys AS (INSERT INTO "CsvImportKey"(id,"userId","accountId","batchId","externalKey","payloadHash") SELECT "keyId",$1::uuid,$2::uuid,$3::uuid,"externalKey","payloadHash" FROM incoming ON CONFLICT("userId","accountId","externalKey") DO NOTHING RETURNING "externalKey"), inserted AS (INSERT INTO "Transaction"(id,"userId","accountId","categoryId",title,amount,date,"csvBatchId","updatedAt") SELECT incoming.id,$1::uuid,$2::uuid,incoming."categoryId",incoming.title,incoming.amount::bigint,incoming.date::date,$3::uuid,date_trunc('milliseconds',clock_timestamp()) FROM incoming JOIN new_keys USING("externalKey") RETURNING id) SELECT count(*) AS inserted FROM inserted`,ownerId,batch.accountId,batchId,JSON.stringify(incoming));
 const inserted=Number(result[0].inserted),skipped=rows.length-inserted;
 await tx.$executeRawUnsafe('UPDATE "CsvImportBatch" SET "importedAt"=now(),"importedCount"=$3,"skippedCount"=$4 WHERE id=$1::uuid AND "userId"=$2::uuid',batchId,ownerId,inserted,skipped);
 await tx.auditLog.create({data:{userId:ownerId,action:'integration.csv.import',outcome:'success'}});return {inserted,skipped,repeated:false};
 });
}
