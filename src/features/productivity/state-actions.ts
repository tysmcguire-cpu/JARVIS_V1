'use server';
import {withCustomerDatabase} from '@/lib/customer-db';
import {stateKey,validateState} from './contracts';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {catalogSql} from './catalog-query';
import {linksSchema} from './contracts';
import {entityFor} from '@/features/tracking/config';
export async function readPersonalState(key:string){stateKey.parse(key);return withCustomerDatabase(async(tx,owner)=>{
 const rows=await tx.$queryRawUnsafe<{value:unknown;version:number}[]>('SELECT value,version FROM "WorkspaceState" WHERE "userId"=$1::uuid AND key=$2',owner,key);return rows[0]??{value:null,version:0};
})}
export async function savePersonalState(key:string,input:unknown,version:number){const value=validateState(key,input);if(key.startsWith('note-history:'))throw Error('Note revisions are created only when saving a note.');z.number().int().nonnegative().parse(version);
 return withCustomerDatabase(async(tx,owner)=>{
  if(key.startsWith('note-draft:')||key.startsWith('calculator:')){
   const entity=key.startsWith('calculator:')?'Course':'Note',id=key.split(':')[1];
   const rows=await tx.$queryRawUnsafe<{id:string}[]>(`SELECT id FROM (${catalogSql([entity])}) c WHERE id=$2::uuid`,owner,id);if(!rows.length)throw Error('The record is unavailable.');
  }
  if(key.startsWith('links:')){
   const [,entity,id]=key.split(':');entityFor(entity);const links=linksSchema.parse(value);for(const link of links)entityFor(link.key);
   const wanted=[{key:entity,id},...links];
   const found=await tx.$queryRawUnsafe<{key:string;id:string}[]>(`SELECT c.key,c.id FROM (${catalogSql([...new Set(wanted.map(r=>r.key))])}) c JOIN jsonb_to_recordset($2::jsonb) AS w(key text,id uuid) ON c.key=w.key AND c.id=w.id`,owner,JSON.stringify(wanted));
   if(found.length!==wanted.length)throw Error('A linked record is unavailable.');
  }
  const rows=await tx.$queryRawUnsafe<{version:number}[]>('INSERT INTO "WorkspaceState" (id,"userId",key,value,version,"updatedAt") SELECT $1::uuid,$2::uuid,$3::varchar(160),$4::jsonb,1,now() WHERE $5=0 OR EXISTS(SELECT 1 FROM "WorkspaceState" WHERE "userId"=$2::uuid AND key=$3::varchar(160) AND version=$5) ON CONFLICT ("userId",key) DO UPDATE SET value=EXCLUDED.value,version="WorkspaceState".version+1,"updatedAt"=now() WHERE "WorkspaceState".version=$5 RETURNING version',randomUUID(),owner,key,JSON.stringify(value),version);
  if(!rows.length)throw Error('This view changed on another device. Reload before saving.');
  await tx.auditLog.create({data:{userId:owner,action:'tracking.WorkspaceState.update',outcome:'success'}});return {value,version:rows[0].version};
 });
}
export async function clearPersonalDraft(id:string,version:number){z.uuid().parse(id);z.number().int().nonnegative().parse(version);return withCustomerDatabase(async(tx,owner)=>{
 const deleted=await tx.$executeRawUnsafe('DELETE FROM "WorkspaceState" WHERE "userId"=$1::uuid AND key=$2 AND version=$3',owner,'note-draft:'+id,version);
 if(version&&!deleted)throw Error('The draft changed on another device. Reload first.');return {ok:true};
})}
