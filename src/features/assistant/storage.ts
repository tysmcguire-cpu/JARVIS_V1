import type {Prisma} from '@prisma/client';
import type {Source} from './contract';
// The caller supplies an already authenticated transaction and its owner identity.
export async function storeReferences(tx:Pick<Prisma.TransactionClient,'$executeRawUnsafe'>,owner:string,conversation:string,sources:Source[]){
 await tx.$executeRawUnsafe(`INSERT INTO "AiSourceReference"(id,"userId","conversationId",reference,label,href,"sourceUpdatedAt","fetchedAt") SELECT gen_random_uuid(),$1::uuid,$2::uuid,s.id,s.label,s.href,s."updatedAt"::timestamptz,s."fetchedAt"::timestamptz FROM jsonb_to_recordset($3::jsonb) AS s(id text,label text,href text,"updatedAt" text,"fetchedAt" text)`,owner,conversation,JSON.stringify(sources));
}
